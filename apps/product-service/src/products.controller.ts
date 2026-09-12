import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from '@app/common';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern('products.create')
  create(@Payload() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @MessagePattern('products.findAll')
  findAll() {
    return this.productsService.findAll();
  }

  @MessagePattern('products.findOne')
  findOne(@Payload() id: string) {
    return this.productsService.findOne(id);
  }

  @MessagePattern('products.update')
  update(@Payload() payload: { id: string; dto: UpdateProductDto }) {
    return this.productsService.update(payload.id, payload.dto);
  }

  @MessagePattern('products.remove')
  remove(@Payload() id: string) {
    return this.productsService.remove(id);
  }

  @MessagePattern('products.reserveStock')
  reserveStock(@Payload() items: { productId: string; quantity: number }[]) {
    return this.productsService.reserveStock(items);
  }
}
