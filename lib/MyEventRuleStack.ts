import * as path from 'path';
import { Construct } from 'constructs';
import { NestedStack, NestedStackProps } from 'aws-cdk-lib/core';
import * as events from 'aws-cdk-lib/aws-events';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';

interface MyEventRuleProps extends NestedStackProps {
  prefix: string;
  lambda?: NodejsFunctionProps;
  eventBus: events.IEventBus;
  environment?: { [name: string]: string };
}

export class MyEventRuleStack extends NestedStack {
  rule: events.Rule;
  lambda: NodejsFunction;

  constructor(scope: Construct, id: string, props: MyEventRuleProps) {
    super(scope, id, props);

    this.rule = new events.Rule(scope, `${id}-rule`, {
      ruleName: `${props.prefix}--${id}`,
      eventBus: props.eventBus,
      eventPattern: {
      }
    });

    this.lambda = new NodejsFunction(this, `${id}-func`, {
      ...(props.lambda || {}),
      functionName: `${props.prefix}--${id}`,
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'handler',
      entry: path.join(__dirname, `events/${id}/index.ts`),
      environment: {
        ...(props.environment || {})
      }
    });
  }
}
