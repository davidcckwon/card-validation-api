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

new Stack(app, `${stage}-${serviceName}`, {
  env: {
    region: region
  },
  serviceName: serviceName,
  stage: stage
});

