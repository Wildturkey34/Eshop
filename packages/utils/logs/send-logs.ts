import { kafka } from '../kafka';

const producer = kafka.producer();

export async function sendLog({
  type = 'info',
  message,
  source = 'unknown-service',
}: {
  type?: 'info' | 'error' | 'warning' | 'success' | 'debug';
  message: string;
  source?: string;
}) {
  try {
    const logPayload = {
      type,
      message,
      timestamp: new Date().toISOString(),
      source,
    };

    await producer.connect();
    await producer.send({
      topic: 'logs',
      messages: [{ value: JSON.stringify(logPayload) }],
    });
    await producer.disconnect();
  } catch (error) {
    // Fail silently if Kafka is not available
    // This prevents blocking operations when Kafka service is down
    console.warn('[sendLog] Failed to send log to Kafka:', message);
  }
}
