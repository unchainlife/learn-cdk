import { NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

interface MyDynamoTableStackProps extends NestedStackProps {
  /**
   * prefix used for all resources
   */
  prefix: string;
}

export class MyDynamoTableStack extends NestedStack {
  table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: MyDynamoTableStackProps) {
    super(scope, id, props);

    this.table = new dynamodb.Table(this, 'table', {
      tableName: `${props.prefix}--${id}`,
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: 'ttl'
    });
  }
}
