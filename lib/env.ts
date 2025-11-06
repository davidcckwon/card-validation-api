/**
 * Environment configuration for CDK deployment
 */

export interface EnvironmentConfig {
  readonly instanceType: string;
  readonly port: number;
  readonly serviceName: string;
}

/**
 * Get environment configuration for deployment
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  return {
    instanceType: 'T3.MICRO',
    port: 3000,
    serviceName: 'card-validator-api'
  };
}
