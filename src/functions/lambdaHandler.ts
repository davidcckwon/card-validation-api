import { APIGatewayProxyEvent, APIGatewayProxyResult, Context, Callback } from 'aws-lambda';
import serverlessExpress from '@vendia/serverless-express';
import { app } from '../index';

const serverlessApp = serverlessExpress({ app });

export const handler = (
  event: APIGatewayProxyEvent,
  context: Context,
  callback: Callback<APIGatewayProxyResult>
): void => {
  serverlessApp(event, context, callback);
};

