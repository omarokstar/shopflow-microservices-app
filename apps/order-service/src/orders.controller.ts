import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from '@app/common';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('orders.create')
  create(@Payload() payload: { userId: string; userEmail: string; dto: CreateOrderDto }) {
    return this.ordersService.create(payload.userId, payload.userEmail, payload.dto);
  }

  @MessagePattern('orders.findAllForUser')
  findAllForUser(@Payload() userId: string) {
    return this.ordersService.findAllForUser(userId);
  }

  @MessagePattern('orders.findOne')
  findOne(@Payload() id: string) {
    return this.ordersService.findOne(id);
  }
}
