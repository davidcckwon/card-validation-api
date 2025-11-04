import { StackProps } from 'aws-cdk-lib';

export interface CardValidatorStackProps extends StackProps {
  readonly serviceName: string;
  readonly stage: string;
  readonly lambdaTimeout?: number;
  readonly lambdaMemory?: number;
  readonly ec2InstanceType?: string;
  readonly ec2Port?: number;
  readonly allowedOrigins?: string[];
  readonly enableEc2?: boolean;
}

