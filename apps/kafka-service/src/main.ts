import { kafka } from '@packages/utils/kafka';
import { updateUserAnalaytics } from './services/analytics.service';

const consumer = kafka.consumer({ groupId: 'user-events-group' });
const eventQueue: any[] = [];

const processQueue = async () => {
  if (eventQueue.length === 0) return;
  const events = [...eventQueue];
  eventQueue.length = 0;

  for (const event of events) {
    if (event.action === 'shop_visit') {
      //update shop analytics
    }

    const validActions = [
      'add_to_wishlist',
      'add_to_cart',
      'product_view',
      'remove_from_wishlist',
      'remove_from_cart',
    ];

    if (!event.action || !validActions.includes(event.action)) {
      continue;
    }

    try {
      await updateUserAnalaytics(event);
    } catch (error) {
      console.log('Error processing event: ', error);
    }
  }
};

setInterval(processQueue, 3000);

// Kafka consumer with retry logic
export const consumeKafkaMessages = async () => {
  let retries = 0;
  const maxRetries = 10;

  while (retries < maxRetries) {
    try {
      await consumer.connect();
      console.log('✅ Connected to Kafka');

      // Wait a bit for Kafka to be ready
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await consumer.subscribe({
        topic: 'users-events',
        fromBeginning: false,
      });
      console.log('✅ Subscribed to users-events topic');

      await consumer.run({
        eachMessage: async ({ message }) => {
          if (!message.value) return;
          const event = JSON.parse(message.value.toString());
          eventQueue.push(event);
          console.log('📥 Received event:', event.action);
        },
      });

      return; // Success, exit retry loop
    } catch (error) {
      retries++;
      console.log(
        `❌ Failed to connect (attempt ${retries}/${maxRetries}):`,
        error
      );

      if (retries >= maxRetries) {
        console.error('💥 Max retries reached. Exiting...');
        process.exit(1);
      }

      // Wait before retry (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 5000 * retries));
    }
  }
};

consumeKafkaMessages().catch(console.error);
