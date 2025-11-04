import { CardValidatorStackProps } from './stackProps';
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export class Stack extends cdk.Stack {
  readonly api: apigateway.RestApi;
  readonly lambdaFunction: NodejsFunction;

  constructor(scope: Construct, id: string, props: CardValidatorStackProps) {
    super(scope, id, props);

    if (!props) {
      throw new Error('props unavailable');
    }

    const resourceServiceName = 'card-validator';

    this.lambdaFunction = new NodejsFunction(this, 'CardValidatorFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      functionName: `${props.stage}-${resourceServiceName}-api`,
      entry: path.join(__dirname, '../src/functions/lambdaHandler.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        NODE_ENV: props.stage === 'prod' ? 'production' : 'development'
      }
    });

    this.api = new apigateway.RestApi(this, 'CardValidatorApi', {
      restApiName: `${props.stage}-${resourceServiceName}-api`,
      description: 'Credit card validation API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS
      }
    });

    const validateIntegration = new apigateway.LambdaIntegration(this.lambdaFunction);
    const healthIntegration = new apigateway.LambdaIntegration(this.lambdaFunction);

    this.api.root.addResource('validate').addMethod('POST', validateIntegration);
    this.api.root.addResource('health').addMethod('GET', healthIntegration);

    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 1,
      natGateways: 0
    });

    const role = new iam.Role(this, 'Ec2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
      ]
    });

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y docker',
      'systemctl start docker',
      'systemctl enable docker',
      'usermod -a -G docker ec2-user',
      'mkdir -p /opt/card-validator',
      'cd /opt/card-validator'
    );

    const instance = new ec2.Instance(this, 'CardValidatorInstance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      role,
      userData
    });

    instance.connections.allowFromAnyIpv4(ec2.Port.tcp(80));

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'API Gateway endpoint URL'
    });

    new cdk.CfnOutput(this, 'Ec2InstanceId', {
      value: instance.instanceId,
      description: 'EC2 instance ID'
    });

    new cdk.CfnOutput(this, 'Ec2PublicIp', {
      value: instance.instancePublicIp,
      description: 'EC2 public IP address'
    });
  }
}

