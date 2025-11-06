#!/usr/bin/env node
/**
 * CDK App Entry Point
 * 
 * Usage:
 *   pnpm run deploy    # Deploy to AWS
 * 
 * Prerequisites:
 *   1. AWS credentials: aws configure
 *   2. CDK bootstrap: pnpm run bootstrap
 */
import { App, Tags } from 'aws-cdk-lib';
import 'source-map-support/register';
import { getEnvironmentConfig } from '../lib/env';
import { CardValidatorApiStack } from '../lib/stack';

const app = new App();
const envConfig = getEnvironmentConfig();

// CDK resolves account/region from AWS credentials automatically when env is not specified
// This allows VPC lookup to work during synthesis
const stack = new CardValidatorApiStack(app, envConfig.serviceName, {
  serviceName: envConfig.serviceName,
  port: envConfig.port,
  ec2InstanceType: envConfig.instanceType
});

Tags.of(stack).add('Service', envConfig.serviceName);

