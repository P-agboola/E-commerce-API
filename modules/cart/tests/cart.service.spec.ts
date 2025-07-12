import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { CartService } from '../cart.service';
import { Cart } from '../schemas/cart.schema';
import { Product, ProductStatus } from '../../product/entities/product.entity';
import { ProductService } from '../../product/product.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

type MockModel<T = any> = Partial<Record<keyof Model<T>, jest.Mock>>;
type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('CartService', () => {
  let cartService: CartService;
  let cartModel: MockModel<Cart>;
  let productRepository: MockRepository<Product>;
  let productService: jest.Mocked<ProductService>;

  const mockUserId = 'test-user-id';
  const mockSessionId = 'test-session-id';
  const mockProductId = 'test-product-id';

  const mockProduct = {
    id: mockProductId,
    name: 'Test Product',
    description: 'This is a test product',
    price: 99.99,
    discountPrice: 0,
    quantity: 10,
    images: ['image1.jpg'],
    tags: ['test'],
    categories: ['electronics'],
    status: ProductStatus.ACTIVE,
    featured: false,
    rating: 0,
    reviewCount: 0,
    attributes: {},
    sku: 'TEST-SKU',
    barcode: 'TEST-BARCODE',
    sellerId: 'seller-id',
    seller: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    // Virtual getters
    get discountPercentage() {
      return 0;
    },
    get isOnSale() {
      return false;
    },
    get isInStock() {
      return true;
    },
  };

  const mockCartItem = {
    productId: mockProductId,
    quantity: 2,
    price: 99.99,
    name: 'Test Product',
    image: 'image1.jpg',
  };

  const mockCart = {
    _id: 'test-cart-id',
    userId: mockUserId,
    sessionId: null,
    items: [mockCartItem],
    totalItems: 2,
    totalAmount: 199.98,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    // Create a mock constructor function that can be called with 'new'
    const MockCartModel = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({
        _id: 'new-cart-id',
        ...data,
      }),
    }));

    // Add static methods to the constructor function
    (MockCartModel as any).findOne = jest.fn(() => ({
      exec: jest.fn(),
    }));
    (MockCartModel as any).find = jest.fn();
    (MockCartModel as any).create = jest.fn();
    (MockCartModel as any).findOneAndUpdate = jest.fn();
    (MockCartModel as any).findByIdAndUpdate = jest.fn(() => ({
      exec: jest.fn(),
    }));
    (MockCartModel as any).exec = jest.fn();

    const mockProductRepository = {
      findOne: jest.fn(),
    };

    const mockProductService = {
      findOne: jest.fn(),
      updateStock: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: getModelToken(Cart.name),
          useValue: MockCartModel,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: ProductService,
          useValue: mockProductService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'app.anonymousCartExpiryDays') return 7;
              return null;
            }),
          },
        },
      ],
    }).compile();

    cartService = module.get<CartService>(CartService);
    cartModel = module.get<MockModel<Cart>>(getModelToken(Cart.name));
    productRepository = module.get<MockRepository<Product>>(
      getRepositoryToken(Product),
    );
    productService = module.get(ProductService);
  });

  it('should be defined', () => {
    expect(cartService).toBeDefined();
  });

  describe('findByUserId', () => {
    it('should return a user cart if it exists', async () => {
      (cartModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCart),
      });

      const result = await cartService.findByUserId(mockUserId);

      expect(cartModel.findOne).toHaveBeenCalledWith({
        userId: mockUserId,
        isActive: true,
      });
      expect(result).toEqual(mockCart);
    });

    it('should create a new cart if one does not exist', async () => {
      (cartModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await cartService.findByUserId(mockUserId);

      expect(cartModel.findOne).toHaveBeenCalledWith({
        userId: mockUserId,
        isActive: true,
      });
      expect(result._id).toBe('new-cart-id');
      expect(result.userId).toBe(mockUserId);
    });
  });

  describe('addItem', () => {
    it('should add an item to the cart', async () => {
      const addItemDto = {
        productId: mockProductId,
        quantity: 2,
      };

      (cartModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCart),
      });

      (cartModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCart),
      });

      productService.findOne.mockResolvedValue(mockProduct);
      mockCart.save.mockResolvedValue(mockCart);

      const result = await cartService.addItem(mockUserId, addItemDto);

      expect(productService.findOne).toHaveBeenCalledWith(mockProductId);
      expect(result).toEqual(mockCart);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      const addItemDto = {
        productId: 'non-existent-product',
        quantity: 1,
      };

      productService.findOne.mockRejectedValue(
        new NotFoundException('Product not found'),
      );

      await expect(cartService.addItem(mockUserId, addItemDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if product is out of stock', async () => {
      const addItemDto = {
        productId: mockProductId,
        quantity: 1,
      };

      const outOfStockProduct = { ...mockProduct, quantity: 0 };
      productService.findOne.mockResolvedValue(outOfStockProduct);

      await expect(cartService.addItem(mockUserId, addItemDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('removeItem', () => {
    it('should remove an item from the cart', async () => {
      (cartModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCart),
      });

      (cartModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockCart,
          items: [],
        }),
      });

      const result = await cartService.removeItem(mockUserId, 0);

      expect(cartModel.findOne).toHaveBeenCalledWith({
        userId: mockUserId,
        isActive: true,
      });
      expect(result.items).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should clear all items from the cart', async () => {
      (cartModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCart),
      });

      (cartModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockCart,
          items: [],
        }),
      });

      const result = await cartService.clear(mockUserId);

      expect(cartModel.findOne).toHaveBeenCalledWith({
        userId: mockUserId,
        isActive: true,
      });
      expect(result.items).toEqual([]);
    });
  });

  // Additional tests for other methods like updateItem, mergeAnonymousCart, etc.
});
