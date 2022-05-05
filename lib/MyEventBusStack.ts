import { Duration, Stack, NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';

interface MyEventBusProps extends NestedStackProps {
  prefix: string;
}

export class MyEventBusStack extends NestedStack {
  bus: events.EventBus;
  archive: events.Archive;

  constructor(scope: Construct, id: string, props: MyEventBusProps) {
    super(scope, id, props);

    this.bus = new events.EventBus(this, 'event-bus', {
      eventBusName: `${props.prefix}--bus`
    });

    this.archive = this.bus.archive('archive', {
      archiveName: `${props.prefix}--bus--archive`,
      description: '',
      eventPattern: {
        account: [Stack.of(this).account]
      },
      retention: Duration.days(365)
    });
  }
}
