import { Stack, StackProps, NestedStackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { MyQueueStack } from './MyQueueStack';
import { MyEventBusStack } from './MyEventBusStack';
import { MyDynamoTableStack } from './MyDynamoTableStack';
import { MyEventRuleStack } from './MyEventRuleStack';

export class IacCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const { PROJECT, ENV } = { ...{ PROJECT: 'FOO', ENV: 'DEV' }, ...process.env };

    const prefix = `${PROJECT}--${ENV}`;

    const immunizations = new MyDynamoTableStack(this, 'immunizations', { prefix });

    const eventBus = new MyEventBusStack(this, 'event-bus', { prefix });

    const letterRequest = new MyQueueStack(this, 'letter-request', {
      prefix,
      environment: {
        TABLE_NAME: immunizations.table.tableName,
        EVENT_BUS_NAME: eventBus.bus.eventBusName
      }
    });
    immunizations.table.grantReadData(letterRequest.lambda);
    eventBus.bus.grantPutEventsTo(letterRequest.lambda);

    // ------------------------------------------------------------------------
    // Letter Request API
    // ------------------------------------------------------------------------

    // const requestApi = new apigateway.RestApi(this, 'letter-request-api', {
    //   restApiName: `${PREFIX}--letter-request-api`
    // });
    // const letterResource = requestApi.root.addResource('letter', {});
    // const letterFunction = new NodejsFunction(this, 'letter-post', {
    //   functionName: `${PREFIX}--letter-post`,
    //   runtime: lambda.Runtime.NODEJS_14_X,
    //   handler: 'handler',
    //   entry: path.join(__dirname, 'api/letter-request/letter-post/index.ts'),
    //   environment: {
    //     QUEUE_NAME: requestQueue.queueName
    //   }
    // });
    // requestQueue.grantSendMessages(letterFunction);
    // immunizationDb.grantReadWriteData(letterFunction);
    // const letterMethod = letterResource.addMethod('POST', new apigateway.LambdaIntegration(letterFunction), {});

    // ------------------------------------------------------------------------
    // Immunization API
    // ------------------------------------------------------------------------

    // const api = new apigateway.RestApi(this, `immunization--api`, {
    //   restApiName: `${PREFIX}--immunization`
    // });
    // const fhir = api.root.addResource('FHIR', {});
    // const v4 = fhir.addResource('V4');
    // const immunization = v4.addResource('Immunization');
    // const func = new NodejsFunction(this, 'immunization-get', {
    //   functionName: `${PREFIX}--immunization-get`,
    //   runtime: lambda.Runtime.NODEJS_14_X,
    //   handler: 'handler',
    //   entry: path.join(__dirname, 'api/immunization/immunization-get/index.ts'),
    //   environment: {
    //     TABLE_NAME: immunizationDb.tableName
    //   }
    // });
    // immunizationDb.grantReadData(func);
    // const immunizationGet = immunization.addMethod('GET', new apigateway.LambdaIntegration(func));
  }
}
