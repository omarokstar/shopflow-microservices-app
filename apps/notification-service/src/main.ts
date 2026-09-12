import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NotificationServiceModule } from './notification-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    NotificationServiceModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
        queue: 'order_events_queue',
        queueOptions: { durable: true },
        // Manual ack to ensure successful processing.
        noAck: false,
      },
    },
  );
  await app.listen();
  console.log('Notification service consuming RabbitMQ queue: order_events_queue');
}
bootstrap();
