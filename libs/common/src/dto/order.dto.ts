import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';

export class OrderItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

export interface OrderCreatedEvent {
  orderId: string;
  userId: string;
  userEmail: string;
  totalAmount: number;
  items: OrderItemDto[];
  createdAt: string;
}
