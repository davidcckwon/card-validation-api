import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Instance, InstanceClass, InstanceSize, InstanceType, Peer, Port, SecurityGroup, SubnetType, UserData, Vpc } from 'aws-cdk-lib/aws-ec2';
import { DockerImageAsset, Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { EcsOptimizedImage } from 'aws-cdk-lib/aws-ecs';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

/**
 * Defines the properties for the CardValidatorApiStack.
 */
export interface CardValidatorStackProps extends StackProps {
  readonly serviceName: string;
  readonly port: number;
  readonly ec2InstanceType?: string;
}


/**
 * CDK Stack for deploying the Card Validator API to a single EC2 instance.
 * Uses ECS-optimized AMI which includes Docker pre-installed.
 * CDK builds the Docker image locally and pushes it to ECR.
 * EC2 instance pulls the image from ECR and runs it.
 */
export class CardValidatorApiStack extends Stack {
  readonly ec2Instance: Instance;

  constructor(scope: Construct, id: string, props: CardValidatorStackProps) {
    super(scope, id, props);
    if (!props) throw new Error('props unavailable');

    // --- 1. VPC and Instance Type Configuration ---
    const vpc = new Vpc(this, 'CardValidatorVPC', {
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
    const [instanceClass, instanceSize] = (props.ec2InstanceType || 'T3.MICRO').split('.');
    const instanceType = InstanceType.of(
      InstanceClass[instanceClass as keyof typeof InstanceClass] || InstanceClass.T3,
      InstanceSize[instanceSize as keyof typeof InstanceSize] || InstanceSize.MICRO
    );

    // --- 2. IAM Role (Permissions) ---
    const role = new Role(this, 'InstanceRole', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for the EC2 host, allowing SSM access and ECR pull',
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
      ]
    });

    // --- 3. Security Group (Networking) ---
    const sg = new SecurityGroup(this, 'CardValidatorSG', {
      vpc,
      allowAllOutbound: true,
      description: 'Security group for card validator API'
    });
    sg.addIngressRule(Peer.anyIpv4(), Port.tcp(props.port), `Allow HTTP traffic on port ${props.port}`);

    // --- 4. Container Image Asset (Docker Image) ---
    // CDK builds the Docker image locally and pushes it to ECR
    // Build for linux/amd64 platform to match EC2 instance architecture
    const imageAsset = new DockerImageAsset(this, 'AppImage', {
      directory: '.',
      platform: Platform.LINUX_AMD64,
    });

    // Grant the EC2 role permission to pull the image from ECR
    imageAsset.repository.grantPull(role);

    // --- 5. User Data (Bootstrap Script) ---
    const userData = UserData.forLinux({ shebang: '#!/bin/bash' });

    // Add ec2-user to docker group (Docker is pre-installed on ECS-optimized AMI)
    userData.addCommands('usermod -aG docker ec2-user');

    // Login to ECR and pull the image
    const imageUri = imageAsset.imageUri;
    const accountId = this.account;
    const region = this.region;
    const ecrRegistry = `${accountId}.dkr.ecr.${region}.amazonaws.com`;

    userData.addCommands(
      `aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${ecrRegistry}`,
      `docker stop ${props.serviceName} || true`,
      `docker rm ${props.serviceName} || true`,
      `docker pull ${imageUri}`,
      `docker run -d --name ${props.serviceName} -p ${props.port}:3000 --restart unless-stopped ${imageUri}`
    );

    // --- 6. EC2 Instance Creation ---
    // Use ECS-optimized AMI which includes Docker pre-installed
    const ami = EcsOptimizedImage.amazonLinux2023();

    this.ec2Instance = new Instance(this, 'CardValidatorInstance', {
      vpc,
      instanceType,
      machineImage: ami,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
      role,
      securityGroup: sg,
      userData,
      instanceName: props.serviceName
    });

    // --- 7. Outputs ---
    new CfnOutput(this, 'Ec2InstanceId', {
      value: this.ec2Instance.instanceId,
      description: 'EC2 instance ID - Use SSM Session Manager to connect.'
    });
    new CfnOutput(this, 'Ec2PublicIp', {
      value: this.ec2Instance.instancePublicIp,
      description: 'EC2 public IP address'
    });
    new CfnOutput(this, 'ApiEndpoint', {
      value: `http://${this.ec2Instance.instancePublicIp}:${props.port}`,
      description: 'API endpoint URL (access via public IP on host port)'
    });
  }
}
