#!/usr/bin/env node
/**
 * CDK App Entry Point
 * 
 * Usage:
 *   pnpm run build && cdk deploy                 # Deploy to dev
 *   pnpm run build && cdk deploy --context stage=prod
 * 
 * Prerequisites:
 *   1. AWS credentials: aws configure
 *   2. CDK bootstrap: cdk bootstrap
 */
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { getEnvironmentConfig } from '../lib/env';
import { CreditCardValidatorApiStack } from '../lib/stack';

const app = new cdk.App();
// Read stage from CDK context (defaults to 'dev')
const stage = app.node.tryGetContext('stage') || 'dev';
const envConfig = getEnvironmentConfig(stage);

const stack = new CreditCardValidatorApiStack(app, `${stage}-CardValidator`, {
  env: {
    account: envConfig.account,
    region: envConfig.region
  },
  serviceName: 'CardValidator',
  stage: envConfig.stage,
  port: envConfig.port,
  ec2InstanceType: envConfig.instanceType
});

// Apply tags for resource organization and cost tracking
cdk.Tags.of(stack).add('Environment', stage);
cdk.Tags.of(stack).add('Service', 'CardValidator');

