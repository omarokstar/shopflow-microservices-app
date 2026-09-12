import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ProductServiceModule } from './product-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ProductServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: Number(process.env.PRODUCT_SERVICE_PORT) || 3002,
      },
    },
  );
  await app.listen();
  console.log('Product service listening on TCP :' + (process.env.PRODUCT_SERVICE_PORT || 3002));
}
bootstrap();
