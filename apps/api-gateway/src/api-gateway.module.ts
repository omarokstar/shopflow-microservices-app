import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { AuthController } from './auth/auth.controller';
import { ProductsController } from './products/products.controller';
import { OrdersController } from './orders/orders.controller';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),

    TerminusModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'dev-secret-change-me'),
      }),
    }),

    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get('AUTH_SERVICE_HOST', 'localhost'),
            port: config.get<number>('AUTH_SERVICE_PORT', 3001),
          },
        }),
      },
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
        name: 'ORDER_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get('ORDER_SERVICE_HOST', 'localhost'),
            port: config.get<number>('ORDER_SERVICE_PORT', 3003),
          },
        }),
      },
    ]),
  ],
  controllers: [AuthController, ProductsController, OrdersController, HealthController],
})
export class ApiGatewayModule {}
