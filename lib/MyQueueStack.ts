import * as path from 'path';
import { NestedStack, NestedStackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';

/**
 * Standard Queue properties
 */
export interface MyQueueStackProps extends NestedStackProps {
  /**
   * The prefix to be used for all resources
   */
  prefix: string;
  /**
   * environment variables
   */
  environment?: { [name: string]: string };
  /**
   * Queue properties
   */
  queue?: sqs.QueueProps;
  /**
   * Dead-Letter Queue properties
   */
  deadLetterQueue?: sqs.QueueProps;
  /**
   * Lambda properties
   */
  lambda?: NodejsFunctionProps;
}

/**
 * Standard Queue + DLQ + Lambda pattern
 * 
 * Lambda source entry is /sqs/{id}/index.ts
 */

export class MyQueueStack extends NestedStack {
  /**
   * The queue created by this stack
   */
  queue: sqs.Queue;
  /**
   * The Dead Letter Queue created by this stack
   */
  deadLetterQueue: sqs.Queue;
  /**
   * The Node JS Lambda created by this stack
   */
  lambda: lambda.Function;

  constructor(scope: Construct, id: string, props: MyQueueStackProps) {
    super(scope, id, props);

    this.deadLetterQueue = new sqs.Queue(this, `dead-letter`, {
      ...(props.deadLetterQueue || {}),
      queueName: `${props.prefix}--${id}-deadletter`
    });

    this.queue = new sqs.Queue(this, `queue`, {
      removalPolicy: RemovalPolicy.DESTROY,
      ...(props.queue || {}),
      queueName: `${props.prefix}--${id}-queue`,
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: this.deadLetterQueue
      }
    });

    this.lambda = new NodejsFunction(this, `func`, {
      ...(props.lambda || {}),
      functionName: `${props.prefix}--${id}`,
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'handler',
      entry: path.join(__dirname, `sqs/${id}/index.ts`),
      environment: {
        ...(props.environment || {})
      },
      events: [
        new lambdaEventSources.SqsEventSource(this.queue, {})
      ]
    });
  }
}
