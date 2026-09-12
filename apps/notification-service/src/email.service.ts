import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST', 'localhost');
    const port = Number(this.configService.get<number>('SMTP_PORT', 1025));
    const secure = String(this.configService.get('SMTP_SECURE', 'false')) === 'true';
    const user = this.configService.get<string>('SMTP_USER', '');
    const pass = this.configService.get<string>('SMTP_PASSWORD', '');

    const transportOptions: nodemailer.TransportOptions | any = {
      host,
      port,
      secure,
    };

    if (user) {
      transportOptions.auth = {
        user,
        pass,
      };
    }

    this.transporter = nodemailer.createTransport(transportOptions);
  }

  async sendOrderConfirmationEmail(to: string, orderId: string, totalAmount: number): Promise<void> {
    try {
      const from = this.configService.get<string>('SMTP_FROM', 'no-reply@shopflow.com');
      const text = `Thank you for your order! Your order ${orderId} for a total of $${totalAmount} has been confirmed.`;

      await this.transporter.sendMail({
        from,
        to,
        subject: `Order Confirmation - ${orderId}`,
        text,
      });

      this.logger.log(`Order confirmation email sent to ${to} for order ${orderId}`);
    } catch (error) {
      this.logger.error(`Failed to send order confirmation email to ${to}: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }
}
