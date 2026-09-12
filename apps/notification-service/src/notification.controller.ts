import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { OrderCreatedEvent } from '@app/common';
import { EmailService } from './email.service';

@Controller()
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(private readonly emailService: EmailService) { }

  @EventPattern('order.created')
  async handleOrderCreated(@Payload() data: OrderCreatedEvent, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.log(
        `Sending order confirmation email for order ${data.orderId} to user ${data.userEmail} (total: $${data.totalAmount})`,
      );
      await this.emailService.sendOrderConfirmationEmail(data.userEmail, data.orderId, data.totalAmount);
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Failed to process order.created for ${data.orderId}`, error as Error);
      channel.nack(originalMsg, false, true);
    }
  }
}
