#!/usr/bin/env node
import { Stack } from '../lib/stack';
import { PRIMARY_REGION } from '../lib/constants';
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';

const serviceName = 'CardValidator';

const app = new cdk.App();
const regionContext: string | undefined = app.node.tryGetContext('region');
const region: string = regionContext?.trim() || PRIMARY_REGION;
const stageContext: string | undefined = app.node.tryGetContext('stage');
const stage: string = stageContext?.trim() || 'dev';

const lambdaTimeout = app.node.tryGetContext('lambdaTimeout') ?? 30;
const lambdaMemory = app.node.tryGetContext('lambdaMemory') ?? 256;
const ec2InstanceType = app.node.tryGetContext('ec2InstanceType') ?? 'T3.MICRO';
const ec2Port = app.node.tryGetContext('ec2Port') ?? 80;
const allowedOrigins = app.node.tryGetContext('allowedOrigins')?.split(',') ?? ['*'];
const enableEc2 = app.node.tryGetContext('enableEc2') !== 'false';

new Stack(app, `${stage}-${serviceName}`, {
  env: {
    region: region
  },
  serviceName: serviceName,
  stage: stage,
  lambdaTimeout: Number(lambdaTimeout),
  lambdaMemory: Number(lambdaMemory),
  ec2InstanceType: String(ec2InstanceType),
  ec2Port: Number(ec2Port),
  allowedOrigins: allowedOrigins,
  enableEc2: enableEc2 !== false
});

