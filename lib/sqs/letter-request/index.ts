import AWS from 'aws-sdk';
import { SQSHandler, SQSEvent, SQSRecord } from "aws-lambda";
import { DynamoDB, QueryCommand, QueryCommandOutput } from "@aws-sdk/client-dynamodb";
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

AWS.config.update({ region: 'eu-west-2' });
const db = new DynamoDB({ apiVersion: '2012-08-10' });
const events = new EventBridgeClient({ apiVersion: '2015-10-07' });

const { TABLE_NAME, EVENT_BUS_NAME } = process.env;
if (!TABLE_NAME) throw new Error("Invalid Environment Variable: TABLE_NAME");
if (!EVENT_BUS_NAME) throw new Error("Invalid Environment Variable: EVENT_BUS_NAME");

interface IDependenceis {
  db: DynamoDB;
  events: EventBridgeClient;
}

interface IMessage {
  nhsNumber: string;
  country: string;
  special: string;
}

const load = async (nhsNumber: string, { db }: IDependenceis) => {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: {
      ':pk': { 'S': nhsNumber }
    }
  });
  const result = await db.send(command) as QueryCommandOutput;
  if (!result.Items) throw new Error(`No records: ${nhsNumber}`);
  return result.Items!.map(AWS.DynamoDB.Converter.unmarshall);
}

const put = async (detailType: string, detail: any, { events }: IDependenceis) => {
  console.log('put', EVENT_BUS_NAME, detailType, detail);
  const command = new PutEventsCommand({
    Entries: [
      {
        EventBusName: EVENT_BUS_NAME,
        Source: 'com.foo.letter-service',
        DetailType: detailType,
        Detail: JSON.stringify(detail)
      }
    ]
  });
  const ouptut = await events.send(command);
  if (ouptut.FailedEntryCount)
    console.error('Failed:', ouptut.FailedEntryCount);
}

const handleRecord = async (record: SQSRecord, message: IMessage, dependencies: IDependenceis) => {
  try {
    const items = await load(message.nhsNumber, dependencies);
    if (items) {
      await put('Success', {}, dependencies);
    } else {
      await put('Failure', {}, dependencies);
    }
  } catch (e: any) {
    await put('Error', { message: e.message }, dependencies);
    throw e;
  }
}

export const handler: SQSHandler = async (event: SQSEvent) => {
  const dependencies: IDependenceis = { db, events };
  const messages: [SQSRecord, IMessage][] = event.Records.map(r => [r, JSON.parse(r.body)]);
  for (const [record, parsed] of messages) {
    await handleRecord(record, parsed, dependencies);
  }
};
