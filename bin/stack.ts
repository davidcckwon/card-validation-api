import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import {
  Instance, InstanceClass, InstanceSize, InstanceType, Peer, Port,
  SecurityGroup, SubnetType, UserData, Vpc
} from 'aws-cdk-lib/aws-ec2';
import { DockerImageAsset, Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { EcsOptimizedImage } from 'aws-cdk-lib/aws-ecs';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface CardValidatorStackProps extends StackProps {
  readonly serviceName: string;
  readonly port: number;
  readonly instanceClass: string;
  readonly instanceSize: string;
}

/**
 * CDK Stack that deploys the API to EC2 with Docker.
 */
export class CardValidatorApiStack extends Stack {
  constructor(scope: Construct, id: string, props: CardValidatorStackProps) {
    super(scope, id, props);
    if (!props) throw new Error('props unavailable');

    const { serviceName, port, instanceClass, instanceSize } = props;

    // VPC Configuration
    const vpc = new Vpc(this, `${serviceName}VPC`, {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: SubnetType.PUBLIC,
        },
      ],
    });

    const instanceType = InstanceType.of(
      InstanceClass[instanceClass as keyof typeof InstanceClass],
      InstanceSize[instanceSize as keyof typeof InstanceSize]
    );

    // IAM Role for EC2 instance
    const role = new Role(this, `${serviceName}InstanceRole`, {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for the EC2 host, allowing SSM access and ECR pull',
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
      ]
    });

    // Security Group
    const securityGroup = new SecurityGroup(this, `${serviceName}SecurityGroup`, {
      vpc,
      allowAllOutbound: true,
      description: 'Security group for card validator API'
    });
    securityGroup.addIngressRule(
      Peer.anyIpv4(), Port.tcp(port), `Allow HTTP traffic on port ${port}`
    );

    // Build and push Docker image to ECR
    // Platform set to linux/amd64 to match EC2 instance architecture
    const imageAsset = new DockerImageAsset(this, `${serviceName}Image`, {
      directory: '.',
      platform: Platform.LINUX_AMD64,
    });

    imageAsset.repository.grantPull(role);

    // Bootstrap script to install and run the Docker container
    const userData = this.createUserData(imageAsset.imageUri, serviceName, port);

    // EC2 Instance with ECS-optimized AMI (includes Docker pre-installed)
    const ami = EcsOptimizedImage.amazonLinux2023();

    const ec2Instance = new Instance(this, `${serviceName}Instance`, {
      vpc,
      instanceType,
      machineImage: ami,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
      role,
      securityGroup,
      userData,
      instanceName: serviceName
    });

    // Stack Outputs
    new CfnOutput(this, 'Ec2InstanceId', {
      value: ec2Instance.instanceId,
      description: 'EC2 instance ID - Use SSM Session Manager to connect.'
    });
    new CfnOutput(this, 'Ec2PublicIp', {
      value: ec2Instance.instancePublicIp,
      description: 'EC2 public IP address'
    });
    new CfnOutput(this, 'ApiEndpoint', {
      value: `http://${ec2Instance.instancePublicIp}:${port}`,
      description: 'API endpoint URL (access via public IP on host port)'
    });
  }

  private createUserData(imageUri: string, serviceName: string, port: number): UserData {
    const userData = UserData.forLinux({ shebang: '#!/bin/bash' });

    // Add ec2-user to docker group
    userData.addCommands('usermod -aG docker ec2-user');

    // ECR login and container deployment
    const ecrRegistry = `${this.account}.dkr.ecr.${this.region}.amazonaws.com`;
    const dockerCommands = [
      `aws ecr get-login-password --region ${this.region} | ` +
        `docker login --username AWS --password-stdin ${ecrRegistry}`,
      `docker stop ${serviceName} || true`,
      `docker rm ${serviceName} || true`,
      `docker pull ${imageUri}`,
      `docker run -d --name ${serviceName} -p ${port}:3000 --restart unless-stopped ${imageUri}`
    ];
    userData.addCommands(...dockerCommands);

    return userData;
  }
}