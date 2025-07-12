import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { WishlistService } from '../wishlist.service';
import { Wishlist } from '../schemas/wishlist.schema';
import { ProductService } from '../../product/product.service';
import { Product, ProductStatus } from '../../product/entities/product.entity';

type MockModel<T = any> = Partial<Record<keyof Model<T>, jest.Mock>>;

describe('WishlistService', () => {
  let wishlistService: WishlistService;
  let wishlistModel: MockModel<Wishlist>;
  let productService: jest.Mocked<ProductService>;

  const mockUserId = 'test-user-id';
  const mockProductId = 'test-product-id';
  
  const mockProduct = {
    id: mockProductId,
    name: 'Test Product',
    description: 'This is a test product',
    price: 99.99,
    discountPrice: 0,
    quantity: 10,
    images: ['image1.jpg'],
    tags: [],
    categories: [],
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
    discountPercentage: 0,
    isOnSale: false,
    isInStock: true
  } as Product;

  const mockWishlist = {
    _id: 'test-wishlist-id',
    userId: mockUserId,
    products: [mockProductId],
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const mockWishlistModel = {
      new: jest.fn().mockResolvedValue(mockWishlist),
      constructor: jest.fn().mockResolvedValue(mockWishlist),
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      exec: jest.fn(),
    };

    const mockProductService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        {
          provide: getModelToken(Wishlist.name),
          useValue: mockWishlistModel,
        },
        {
          provide: ProductService,
          useValue: mockProductService,
        },
      ],
    }).compile();

    wishlistService = module.get<WishlistService>(WishlistService);
    wishlistModel = module.get<MockModel<Wishlist>>(getModelToken(Wishlist.name));
    productService = module.get(ProductService);
  });

  it('should be defined', () => {
    expect(wishlistService).toBeDefined();
  });

  describe('findByUserId', () => {
    it('should return a user wishlist if it exists', async () => {
      (wishlistModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockWishlist),
      });
      productService.findOne.mockResolvedValue(mockProduct);

      const result = await wishlistService.findByUserId(mockUserId);

      expect(wishlistModel.findOne).toHaveBeenCalledWith({ userId: mockUserId });
      expect(productService.findOne).toHaveBeenCalledWith(mockProductId);
      expect(result).toEqual({
        _id: mockWishlist._id,
        userId: mockWishlist.userId,
        products: [mockProduct],
        createdAt: mockWishlist.createdAt,
        updatedAt: mockWishlist.updatedAt,
      });
    });

    it('should create a new wishlist if one does not exist', async () => {
      (wishlistModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      
      const newWishlist = { ...mockWishlist, products: [] };
      wishlistService.create = jest.fn().mockResolvedValue(newWishlist);
      
      (wishlistModel.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(newWishlist),
      });

      const result = await wishlistService.findByUserId(mockUserId);

      expect(wishlistModel.findOne).toHaveBeenCalledWith({ userId: mockUserId });
      expect(wishlistService.create).toHaveBeenCalledWith(mockUserId);
      expect(wishlistModel.findById).toHaveBeenCalledWith(newWishlist._id);
      expect(result).toEqual({
        _id: newWishlist._id,
        userId: newWishlist.userId,
        products: [],
        createdAt: newWishlist.createdAt,
        updatedAt: newWishlist.updatedAt,
      });
    });

    it('should throw NotFoundException if wishlist creation fails', async () => {
      (wishlistModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      
      wishlistService.create = jest.fn().mockResolvedValue({ _id: 'new-id' });
      
      (wishlistModel.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(wishlistService.findByUserId(mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new wishlist', async () => {
      const newWishlist = {
        userId: mockUserId,
        products: [],
        save: jest.fn().mockResolvedValue({
          _id: 'new-wishlist-id',
          userId: mockUserId,
          products: [],
        }),
      };

      // Mock the constructor behavior
      (wishlistModel as any).new = jest.fn().mockReturnValue(newWishlist);
      
      // Alternative approach using create
      (wishlistModel as any).create = jest.fn().mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(newWishlist)
      }));

      const result = await wishlistService.create(mockUserId);

      expect(result.save).toHaveBeenCalled();
    });
  });

  describe('addItem', () => {
    it('should add an item to the wishlist', async () => {
      (wishlistModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockWishlist),
      });

      productService.findOne.mockResolvedValue(mockProduct);
      mockWishlist.save.mockResolvedValue(mockWishlist);
      
      // Ensure product is not already in wishlist
      const wishlistWithoutProduct = {
        ...mockWishlist,
        products: [],
      };
      
      (wishlistModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(wishlistWithoutProduct),
      });

      const result = await wishlistService.addItem(mockUserId, mockProductId);

      expect(productService.findOne).toHaveBeenCalledWith(mockProductId);
      expect(wishlistModel.findOne).toHaveBeenCalledWith({ userId: mockUserId });
      expect(result.products).toContain(mockProductId);
      expect(result.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product does not exist', async () => {
      productService.findOne.mockResolvedValue(null);

      await expect(wishlistService.addItem(mockUserId, 'non-existent-product')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not add duplicate product to wishlist', async () => {
      (wishlistModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockWishlist),
      });

      productService.findOne.mockResolvedValue(mockProduct);
      
      // Product is already in the wishlist
      const result = await wishlistService.addItem(mockUserId, mockProductId);

      expect(productService.findOne).toHaveBeenCalledWith(mockProductId);
      expect(wishlistModel.findOne).toHaveBeenCalledWith({ userId: mockUserId });
      expect(result.products).toContain(mockProductId);
      expect(result.products.filter(id => id === mockProductId).length).toBe(1);
    });
  });

  describe('removeItem', () => {
    it('should remove an item from the wishlist', async () => {
      // Setup mocks
      (wishlistModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockWishlist,
          products: [mockProductId],
          save: jest.fn().mockResolvedValue({
            ...mockWishlist,
            products: [],
          }),
        }),
      });

      // Test removing the item
      const result = await wishlistService.removeItem(mockUserId, mockProductId);

      expect(wishlistModel.findOne).toHaveBeenCalledWith({ userId: mockUserId });
      expect(result.products).not.toContain(mockProductId);
      expect(result.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if wishlist does not exist', async () => {
      (wishlistModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(wishlistService.removeItem(mockUserId, mockProductId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('clear', () => {
    it('should clear all items from the wishlist', async () => {
      // Setup mocks 
      (wishlistModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockWishlist,
          products: [mockProductId],
          save: jest.fn().mockResolvedValue({
            ...mockWishlist,
            products: [],
          }),
        }),
      });
      
      // Test clearing the wishlist
      const result = await wishlistService.clear(mockUserId);

      expect(wishlistModel.findOne).toHaveBeenCalledWith({ userId: mockUserId });
      expect(result.products).toEqual([]);
      expect(result.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if wishlist does not exist', async () => {
      (wishlistModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(wishlistService.clear(mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
