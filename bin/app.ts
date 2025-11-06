#!/usr/bin/env node
import { App, Tags } from 'aws-cdk-lib';
import 'source-map-support/register';
import { getEnvironmentConfig } from './env';
import { CardValidatorApiStack } from './stack';

// Initialize the CDK app
const app = new App();

// Load environment configuration (port, instance type, etc.)
const envConfig = getEnvironmentConfig();

// Instantiate the main stack with environment props
const stack = new CardValidatorApiStack(app, envConfig.serviceName, {
  serviceName: envConfig.serviceName,
  port: envConfig.port,
  instanceClass: envConfig.instanceClass,
  instanceSize: envConfig.instanceSize
});

// Add metadata tags for easier tracking in AWS console
Tags.of(stack).add('Service', envConfig.serviceName);
