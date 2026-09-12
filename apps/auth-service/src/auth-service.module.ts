import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('AUTH_DB_HOST', 'localhost'),
        port: config.get<number>('AUTH_DB_PORT', 5432),
        username: config.get('AUTH_DB_USER', 'postgres'),
        password: config.get('AUTH_DB_PASSWORD', 'postgres'),
        database: config.get('AUTH_DB_NAME', 'authdb'),
        entities: [User],
        // synchronize: true is dev-only; use migrations in production.
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'dev-secret-change-me'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthServiceModule {}
