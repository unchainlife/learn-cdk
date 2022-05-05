import AWS from 'aws-sdk';

AWS.config.update({ region: 'eu-west-2' });
const db = new AWS.DynamoDB({ apiVersion: '2012-08-10' });

const { TABLE_NAME } = process.env;

export const handler = async (event: any) => {
  const pk = event.queryStringParameters['pk'];

  const { Items } = await db.query({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: {
      ':pk': { 'S': pk }
    }
  }).promise();

  const items = Items.map(AWS.DynamoDB.Converter.unmarshall);

  // TODO implement
  const response = {
    statusCode: 200,
    body: JSON.stringify({ message: 'OK', pk, TABLE_NAME, items }),
  };
  return response;
};
