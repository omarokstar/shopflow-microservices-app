import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiGatewayModule } from './api-gateway.module';
import { AllExceptionsFilter, LoggingInterceptor } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);

  // Strip unknown properties and validate payloads.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('ShopFlow API')
    .setDescription('Public HTTP API for the ShopFlow microservices platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.GATEWAY_PORT) || 3000;
  await app.listen(port);
  console.log(`API Gateway listening on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
