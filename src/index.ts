import app from './server';
import serverlessExpress from '@codegenie/serverless-express';

export const handler = serverlessExpress({ app });