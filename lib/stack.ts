import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3assets from 'aws-cdk-lib/aws-s3-assets';
import { Construct } from 'constructs';

export interface CardValidatorStackProps extends cdk.StackProps {
  readonly serviceName: string;
  readonly stage: string;
  readonly port: number;
  readonly ec2InstanceType?: string;
}

/**
 * CDK stack for deploying card validator API to EC2
 * Creates: VPC, Security Group, IAM Role, EC2 Instance
 */
export class CreditCardValidatorApiStack extends cdk.Stack {
  readonly ec2Instance: ec2.Instance;

  /**
   * Create IAM role for EC2 instance
   * Grants SSM Session Manager + S3 read access for code deployment
   */
  private createInstanceRole(asset: s3assets.Asset): iam.Role {
    const role = new iam.Role(this, 'InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
      ]
    });
    asset.grantRead(role);
    return role;
  }

  /**
   * Create security group allowing HTTP traffic on configured port
   * WARNING: Allows access from anywhere (0.0.0.0/0) - for demo purposes only
   * Production: Restrict to specific IP ranges or use ALB
   */
  private createSecurityGroup(vpc: ec2.IVpc, stage: string, port: number): ec2.SecurityGroup {
    const sg = new ec2.SecurityGroup(this, 'CardValidatorSG', {
      vpc,
      allowAllOutbound: true,
      description: `Security group for ${stage} card validator API`
    });
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(port), 'Allow HTTP traffic');
    return sg;
  }

  /**
   * Parse instance type string (e.g., "T3.MICRO") into CDK enum values
   * Defaults to T3.MICRO for cost efficiency
   */
  private parseInstanceType(type?: string): ec2.InstanceType {
    const instanceClass = type?.split('.')[0] ?? 'T3';
    const instanceSize = type?.split('.')[1] ?? 'MICRO';
    return ec2.InstanceType.of(
      ec2.InstanceClass[instanceClass as keyof typeof ec2.InstanceClass] ?? ec2.InstanceClass.T3,
      ec2.InstanceSize[instanceSize as keyof typeof ec2.InstanceSize] ?? ec2.InstanceSize.MICRO
    );
  }

  /**
   * Create systemd service for reliable process management
   * Auto-restart on crash, proper logging, clean shutdown
   */
  private createSystemdService(port: number): string {
    return [
      '[Unit]',
      'Description=Card Validation API',
      'After=network.target',
      '',
      '[Service]',
      'Type=simple',
      'User=ec2-user',
      'WorkingDirectory=/home/ec2-user/app',
      `Environment="PORT=${port}"`,
      'ExecStart=/usr/bin/node dist/src/app.js',
      'Restart=always',
      'RestartSec=10',
      'StandardOutput=journal',
      'StandardError=journal',
      'SyslogIdentifier=card-api',
      '',
      '[Install]',
      'WantedBy=multi-user.target'
    ].join('\n');
  }

  /**
   * Create user data script for EC2 bootstrap
   * Installs Node.js, downloads built code from S3, starts systemd service
   */
  private createUserData(port: number, asset: s3assets.Asset): ec2.UserData {
    const userData = ec2.UserData.forLinux();
    const serviceDef = this.createSystemdService(port);
    userData.addS3DownloadCommand({
      bucket: asset.bucket,
      bucketKey: asset.s3ObjectKey,
      localFile: '/tmp/app.zip'
    });
    
    userData.addCommands(
      'yum update -y',
      'yum install -y unzip',
      'curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -',
      'yum install -y nodejs',
      'mkdir -p /home/ec2-user/app',
      'unzip /tmp/app.zip -d /home/ec2-user/app',
      'cd /home/ec2-user/app',
      'npm install -g pnpm',
      'chown -R ec2-user:ec2-user /home/ec2-user/app',
      'sudo -u ec2-user pnpm install --prod',
      `cat > /etc/systemd/system/card-api.service << 'EOF'\n${serviceDef}\nEOF`,
      'systemctl daemon-reload',
      'systemctl enable card-api',
      'systemctl start card-api'
    );
    return userData;
  }

  /**
   * Create CloudFormation outputs for easy access to deployed resources
   */
  private createOutputs(port: number): void {
    new cdk.CfnOutput(this, 'Ec2InstanceId', {
      value: this.ec2Instance.instanceId,
      description: 'EC2 instance ID - SSH using SSM Session Manager'
    });
    new cdk.CfnOutput(this, 'Ec2PublicIp', {
      value: this.ec2Instance.instancePublicIp,
      description: 'EC2 public IP address'
    });
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: `http://${this.ec2Instance.instancePublicIp}:${port}`,
      description: 'API endpoint URL'
    });
  }

  /**
   * Constructor: Create EC2-based card validator API deployment
   * 
   * Resources created:
   * - EC2 instance (Amazon Linux 2023, T3.MICRO)
   * - Security group (allows HTTP on port 3000)
   * - IAM role (SSM access for debugging)
   * 
   * Uses default VPC (no additional networking setup required)
   */
  constructor(scope: Construct, id: string, props: CardValidatorStackProps) {
    super(scope, id, props);
    if (!props) throw new Error('props unavailable');

    // Bundle and upload built application to S3
    const asset = new s3assets.Asset(this, 'AppAsset', {
      path: '.',
      exclude: [
        'node_modules',
        'cdk.out',
        '.git',
        'test',
        '*.md',
        '.gitignore',
        'jest.config.js',
        'tsconfig.json',
        'bin',
        'lib',
        'src'
      ]
    });

    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVPC', { isDefault: true }) as ec2.IVpc;
    const role = this.createInstanceRole(asset);
    const sg = this.createSecurityGroup(vpc, props.stage, props.port);
    const userData = this.createUserData(props.port, asset);
    const instanceType = this.parseInstanceType(props.ec2InstanceType);

    // Create EC2 instance in public subnet with public IP
    this.ec2Instance = new ec2.Instance(this, 'CardValidatorInstance', {
      vpc,
      instanceType,
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      role,
      securityGroup: sg,
      userData,
      instanceName: `${props.stage}-card-validator`
    });

    this.createOutputs(props.port);
  }
}
