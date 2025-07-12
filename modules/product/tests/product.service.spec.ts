import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import { ProductService } from '../product.service';
import { Product, ProductStatus } from '../entities/product.entity';
import { ProductVariant } from '../schemas/product-variant.schema';
import { Category } from '../schemas/category.schema';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
type MockModel<T = any> = Partial<Record<keyof Model<T>, jest.Mock>>;

describe('ProductService', () => {
  let productService: ProductService;
  let productRepository: MockRepository<Product>;
  let variantModel: MockModel;
  let categoryModel: MockModel;

  const mockProduct = {
    id: 'test-product-id',
    name: 'Test Product',
    description: 'This is a test product',
    price: 99.99,
    stock: 100,
    images: ['image1.jpg', 'image2.jpg'],
    status: ProductStatus.ACTIVE,
    category: 'Electronics',
    specs: { weight: '1kg', dimensions: '10x10x10' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockProductRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      softRemove: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(),
      })),
    };

    const mockVariantModel = {
      find: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const mockCategoryModel = {
      find: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getModelToken(ProductVariant.name),
          useValue: mockVariantModel,
        },
        {
          provide: getModelToken(Category.name),
          useValue: mockCategoryModel,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    productService = module.get<ProductService>(ProductService);
    productRepository = module.get<MockRepository<Product>>(
      getRepositoryToken(Product),
    );
    variantModel = module.get<MockModel>(getModelToken(ProductVariant.name));
    categoryModel = module.get<MockModel>(getModelToken(Category.name));
  });

  it('should be defined', () => {
    expect(productService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        description: 'This is a test product',
        price: 99.99,
        quantity: 100,
        images: ['image1.jpg', 'image2.jpg'],
        status: ProductStatus.ACTIVE,
        categories: ['Electronics'],
        attributes: { weight: '1kg', dimensions: '10x10x10' },
        sellerId: 'seller-123',
      };

      productRepository.create.mockReturnValue(mockProduct);
      productRepository.save.mockResolvedValue(mockProduct);

      const result = await productService.create(createProductDto);

      expect(productRepository.create).toHaveBeenCalledWith(createProductDto);
      expect(productRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockProduct);
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      productRepository.findOne.mockResolvedValue(mockProduct);

      const result = await productService.findOne('test-product-id');

      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-product-id' },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product is not found', async () => {
      productRepository.findOne.mockResolvedValue(null);

      await expect(productService.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );

      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      });
    });
  });

  describe('update', () => {
    it('should update and return the product', async () => {
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Product',
        price: 89.99,
      };

      const updatedProduct = {
        ...mockProduct,
        name: 'Updated Product',
        price: 89.99,
      };

      productRepository.findOne.mockResolvedValue(mockProduct);
      productRepository.save.mockResolvedValue(updatedProduct);

      const result = await productService.update(
        'test-product-id',
        updateProductDto,
      );

      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-product-id' },
      });
      expect(productRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedProduct);
    });

    it('should throw NotFoundException when product is not found', async () => {
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Product',
      };

      productRepository.findOne.mockResolvedValue(null);

      await expect(
        productService.update('non-existent-id', updateProductDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft remove the product', async () => {
      productRepository.findOne.mockResolvedValue(mockProduct);

      await productService.remove('test-product-id');

      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-product-id' },
      });
      expect(productRepository.softRemove).toHaveBeenCalledWith(mockProduct);
    });

    it('should throw NotFoundException when product is not found', async () => {
      productRepository.findOne.mockResolvedValue(null);

      await expect(productService.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // Additional tests for other methods like findAll, updateStock, etc.
});
