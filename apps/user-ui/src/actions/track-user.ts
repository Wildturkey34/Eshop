'use server';
import { kafka } from '../../../../packages/utils/kafka';

const producer = kafka.producer();
let connectPromise: Promise<void> | null = null;

export async function sendKafkaEvent(eventData: {
  userId?: string;
  productId?: string;
  shopId?: string;
  action: string;
  device?: string;
  country?: string;
  city?: string;
}) {
  if (!connectPromise) {
    connectPromise = producer.connect().catch((err) => {
      console.error('🔌 Kafka connection failed:', err);
      connectPromise = null;
    });
  }

  try {
    await connectPromise;
    console.log(
      '📤 Sending Kafka event:',
      eventData.action,
      'for user:',
      eventData.userId
    );

    await producer.send({
      topic: 'users-events',
      messages: [{ value: JSON.stringify(eventData) }],
    });

    console.log('✅ Event sent successfully');
  } catch (error) {
    console.error('❌ Failed to send Kafka event:', error);
  }
}
