import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto, UpdateProductDto } from '@app/common';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
  ) { }

  create(dto: CreateProductDto) {
    const product = this.products.create(dto);
    return this.products.save(product);
  }

  findAll() {
    return this.products.find();
  }

  async findOne(id: string) {
    const product = await this.products.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.findOne(id);
    Object.assign(product, dto);
    return this.products.save(product);
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.products.remove(product);
    return { id, deleted: true };
  }

  // Reserve stock synchronously before order placement.
  async reserveStock(items: { productId: string; quantity: number }[]) {
    const results: { productId: string; unitPrice: number }[] = [];
    for (const item of items) {
      const product = await this.findOne(item.productId);
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.name} (have ${product.stock}, need ${item.quantity})`,
        );
      }
      product.stock -= item.quantity;
      await this.products.save(product);
      results.push({ productId: product.id, unitPrice: Number(product.price) });
    }
    return results;
  }
}
