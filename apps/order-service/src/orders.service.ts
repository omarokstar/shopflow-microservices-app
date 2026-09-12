import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { Order, OrderItem, OrderStatus } from './entities/order.entity';
import { CreateOrderDto, OrderCreatedEvent } from '@app/common';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItems: Repository<OrderItem>,
    @Inject('PRODUCT_SERVICE') private readonly productClient: ClientProxy,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
  ) {}

  // Place order: reserve stock synchronously, then emit event asynchronously.
  async create(userId: string, userEmail: string, dto: CreateOrderDto) {
    const reserved = await firstValueFrom(
      this.productClient.send<{ productId: string; unitPrice: number }[]>(
        'products.reserveStock',
        dto.items,
      ),
    );

    const priceByProduct = new Map(reserved.map((r) => [r.productId, r.unitPrice]));
    const totalAmount = dto.items.reduce(
      (sum, item) => sum + priceByProduct.get(item.productId)! * item.quantity,
      0,
    );

    const order = await this.orders.save(
      this.orders.create({ userId, totalAmount, status: OrderStatus.CONFIRMED }),
    );

    await this.orderItems.save(
      dto.items.map((item) =>
        this.orderItems.create({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: priceByProduct.get(item.productId)!,
        }),
      ),
    );

    const event: OrderCreatedEvent = {
      orderId: order.id,
      userId,
      userEmail,
      totalAmount,
      items: dto.items,
      createdAt: order.createdAt.toISOString(),
    };
    this.rabbitClient.emit('order.created', event);

    return { ...order, items: dto.items };
  }

  findAllForUser(userId: string) {
    return this.orders.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  findOne(id: string) {
    return this.orders.findOne({ where: { id } });
  }
}
