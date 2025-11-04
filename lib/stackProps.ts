import { StackProps } from 'aws-cdk-lib';

export interface CardValidatorStackProps extends StackProps {
  readonly serviceName: string;
  readonly stage: string;
}

