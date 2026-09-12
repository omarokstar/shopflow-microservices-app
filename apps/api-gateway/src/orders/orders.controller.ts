import { Body, Controller, Get, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateOrderDto, JwtAuthGuard } from '@app/common';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('api/orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(@Inject('ORDER_SERVICE') private readonly orderClient: ClientProxy) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    const userId = req.user.sub;
    const userEmail = req.user.email;
    return firstValueFrom(this.orderClient.send('orders.create', { userId, userEmail, dto }));
  }

  @Get()
  findMine(@Req() req: any) {
    return firstValueFrom(this.orderClient.send('orders.findAllForUser', req.user.sub));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.orderClient.send('orders.findOne', id));
  }
}
