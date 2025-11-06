/**
 * Environment configuration for CDK deployment
 * 
 * Simplified single-account deployment strategy
 * For multi-account (dev/staging/prod in separate accounts), extend this config
 */

export interface EnvironmentConfig {
  readonly account: string;
  readonly region: string;
  readonly stage: string;
  readonly instanceType: string;
  readonly port: number;
}

/**
 * Get environment configuration for deployment
 */
export function getEnvironmentConfig(stage: string = 'dev'): EnvironmentConfig {
  const account = process.env.CDK_DEFAULT_ACCOUNT || '';
  const region = process.env.CDK_DEFAULT_REGION || 'us-west-1';
  
  if (!account) {
    throw new Error('CDK_DEFAULT_ACCOUNT not set. Run: cdk bootstrap');
  }

  return {
    account,
    region,
    stage,
    instanceType: 'T3.MICRO',
    port: 3000
  };
}
