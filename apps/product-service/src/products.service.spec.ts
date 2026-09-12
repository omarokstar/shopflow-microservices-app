import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('ProductsService', () => {
  let service: ProductsService;
  let repo: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get(ProductsService);
    repo = module.get(getRepositoryToken(Product));
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('throws NotFoundException when the product does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('returns the product when found', async () => {
      const product = { id: '1', name: 'Laptop', stock: 5, price: 1000 };
      repo.findOne.mockResolvedValue(product);
      await expect(service.findOne('1')).resolves.toEqual(product);
    });
  });

  describe('reserveStock', () => {
    it('throws BadRequestException when stock is insufficient', async () => {
      repo.findOne.mockResolvedValue({ id: '1', name: 'Laptop', stock: 1, price: 1000 });

      await expect(
        service.reserveStock([{ productId: '1', quantity: 5 }]),
      ).rejects.toThrow(BadRequestException);
    });

    it('decrements stock and returns unit prices on success', async () => {
      const product = { id: '1', name: 'Laptop', stock: 10, price: 1000 };
      repo.findOne.mockResolvedValue(product);
      repo.save.mockImplementation((p) => Promise.resolve(p));

      const result = await service.reserveStock([{ productId: '1', quantity: 2 }]);

      expect(product.stock).toBe(8);
      expect(result).toEqual([{ productId: '1', unitPrice: 1000 }]);
    });
  });
});
