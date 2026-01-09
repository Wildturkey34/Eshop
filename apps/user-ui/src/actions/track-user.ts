'use server';
import { kafka } from 'packages/utils/kafka';

const producer = kafka.producer();
let isConnected = false;

export async function sendKafkaEvent(eventData: {
  userId?: string;
  productId?: string;
  shopId?: string;
  action: string;
  device?: string;
  country?: string;
  city?: string;
}) {
  try {
    // Connect once and reuse
    if (!isConnected) {
      await producer.connect();
      isConnected = true;
      console.log('🔌 Kafka producer connected');
    }

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
    isConnected = false; // Reset on error so it reconnects next time
  }
  // DON'T disconnect here - keep connection alive
}
