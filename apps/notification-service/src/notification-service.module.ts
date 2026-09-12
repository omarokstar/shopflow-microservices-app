import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationController } from './notification.controller';
import { EmailService } from './email.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [NotificationController],
  providers: [EmailService],
})
export class NotificationServiceModule {}
