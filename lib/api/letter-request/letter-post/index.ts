import AWS from 'aws-sdk';

AWS.config.update({ region: 'eu-west-2' });
const db = new AWS.DynamoDB({ apiVersion: '2012-08-10' });

const { QUEUE_NAME } = process.env;

export const handler = async (event: any) => {
  const pk = event.queryStringParameters['pk'];
};
