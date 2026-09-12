import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  CreateProductDto,
  JwtAuthGuard,
  Role,
  Roles,
  RolesGuard,
  UpdateProductDto,
} from '@app/common';

@ApiTags('products')
@ApiBearerAuth()
@Controller('api/products')
export class ProductsController {
  constructor(@Inject('PRODUCT_SERVICE') private readonly productClient: ClientProxy) {}

  @Get()
  findAll() {
    return firstValueFrom(this.productClient.send('products.findAll', {}));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.productClient.send('products.findOne', id));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  create(@Body() dto: CreateProductDto) {
    return firstValueFrom(this.productClient.send('products.create', dto));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return firstValueFrom(this.productClient.send('products.update', { id, dto }));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return firstValueFrom(this.productClient.send('products.remove', id));
  }
}
