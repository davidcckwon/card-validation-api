interface EnvironmentConfig {
  readonly instanceClass: string;
  readonly instanceSize: string;
  readonly port: number;
  readonly serviceName: string;
}

export function getEnvironmentConfig(): EnvironmentConfig {
  return {
    instanceClass: 'T3',
    instanceSize: 'MICRO',
    port: 3000,
    serviceName: 'card-validator-api'
  };
}
