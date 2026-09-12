import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order, OrderItem } from './entities/order.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('ORDER_DB_HOST', 'localhost'),
        port: config.get<number>('ORDER_DB_PORT', 5432),
        username: config.get('ORDER_DB_USER', 'postgres'),
        password: config.get('ORDER_DB_PASSWORD', 'postgres'),
        database: config.get('ORDER_DB_NAME', 'orderdb'),
        entities: [Order, OrderItem],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([Order, OrderItem]),
    ClientsModule.registerAsync([
      {
        name: 'PRODUCT_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get('PRODUCT_SERVICE_HOST', 'localhost'),
            port: config.get<number>('PRODUCT_SERVICE_PORT', 3002),
          },
        }),
      },
      {
        name: 'RABBITMQ_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL', 'amqp://localhost:5672')!],
            queue: 'order_events_queue',
            queueOptions: { durable: true },
          },
        } as const),
      },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrderServiceModule {}
