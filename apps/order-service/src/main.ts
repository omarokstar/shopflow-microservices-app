import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { OrderServiceModule } from './order-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    OrderServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: Number(process.env.ORDER_SERVICE_PORT) || 3003,
      },
    },
  );
  await app.listen();
  console.log('Order service listening on TCP :' + (process.env.ORDER_SERVICE_PORT || 3003));
}
bootstrap();
