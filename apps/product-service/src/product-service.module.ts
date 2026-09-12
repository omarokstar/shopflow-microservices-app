import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('PRODUCT_DB_HOST', 'localhost'),
        port: config.get<number>('PRODUCT_DB_PORT', 5432),
        username: config.get('PRODUCT_DB_USER', 'postgres'),
        password: config.get('PRODUCT_DB_PASSWORD', 'postgres'),
        database: config.get('PRODUCT_DB_NAME', 'productdb'),
        entities: [Product],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([Product]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductServiceModule {}
