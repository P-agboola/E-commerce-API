import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CouponService } from '../coupon.service';
import { CouponEntity, DiscountType } from '../entities/coupon.entity';
import { Product } from '../../product/entities/product.entity';
import { CreateCouponDto } from '../dto/create-coupon.dto';
import { UpdateCouponDto } from '../dto/update-coupon.dto';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('CouponService', () => {
  let couponService: CouponService;
  let couponRepository: MockRepository<CouponEntity>;
  let productRepository: MockRepository<Product>;

  const mockCouponId = 'test-coupon-id';
  const mockCouponCode = 'TESTCODE';
  
  const mockCoupon: Partial<CouponEntity> = {
    id: mockCouponId,
    code: mockCouponCode,
    description: 'Test coupon description',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10, // 10% discount
    minimumPurchaseAmount: 100,
    maximumDiscountAmount: 50,
    isActive: true,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    usageLimit: 100,
    usageCount: 0,
    applicableProducts: [],
    isValid: jest.fn().mockReturnValue(true),
    calculateDiscount: jest.fn().mockImplementation(amount => amount * 0.1) // 10% discount
  };

  const mockProductId = 'test-product-id';
  const mockProduct = {
    id: mockProductId,
    name: 'Test Product',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponService,
        {
          provide: getRepositoryToken(CouponEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            findByIds: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findByIds: jest.fn(),
          },
        },
      ],
    }).compile();

    couponService = module.get<CouponService>(CouponService);
    couponRepository = module.get<MockRepository<CouponEntity>>(
      getRepositoryToken(CouponEntity),
    );
    productRepository = module.get<MockRepository<Product>>(
      getRepositoryToken(Product),
    );
  });

  it('should be defined', () => {
    expect(couponService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new coupon successfully', async () => {
      const createCouponDto: CreateCouponDto = {
        code: 'NEWCODE',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 15,
        isActive: true,
      };

      couponRepository.findOne.mockResolvedValue(null);
      couponRepository.create.mockReturnValue(createCouponDto);
      couponRepository.save.mockResolvedValue({ id: 'new-id', ...createCouponDto });

      const result = await couponService.create(createCouponDto);

      expect(couponRepository.findOne).toHaveBeenCalledWith({
        where: { code: createCouponDto.code },
      });
      expect(couponRepository.create).toHaveBeenCalledWith(createCouponDto);
      expect(couponRepository.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 'new-id', ...createCouponDto });
    });

    it('should throw ConflictException if coupon with the same code exists', async () => {
      const createCouponDto: CreateCouponDto = {
        code: mockCouponCode,
        discountType: DiscountType.PERCENTAGE,
        discountValue: 15,
        isActive: true,
      };

      couponRepository.findOne.mockResolvedValue(mockCoupon);

      await expect(couponService.create(createCouponDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create coupon with applicable products', async () => {
      const createCouponDto: CreateCouponDto = {
        code: 'NEWCODE',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 15,
        isActive: true,
        applicableProductIds: [mockProductId],
      };

      const mockProducts = [mockProduct];

      couponRepository.findOne.mockResolvedValue(null);
      productRepository.findByIds.mockResolvedValue(mockProducts);
      
      const createdCoupon = { 
        ...createCouponDto,
        applicableProducts: mockProducts
      };
      
      couponRepository.create.mockReturnValue(createdCoupon);
      couponRepository.save.mockResolvedValue({ id: 'new-id', ...createdCoupon });

      const result = await couponService.create(createCouponDto);

      expect(productRepository.findByIds).toHaveBeenCalledWith([mockProductId]);
      expect(couponRepository.save).toHaveBeenCalled();
      expect(result.applicableProducts).toEqual(mockProducts);
    });

    it('should throw BadRequestException if any product does not exist', async () => {
      const createCouponDto: CreateCouponDto = {
        code: 'NEWCODE',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 15,
        isActive: true,
        applicableProductIds: [mockProductId, 'non-existent-id'],
      };

      couponRepository.findOne.mockResolvedValue(null);
      productRepository.findByIds.mockResolvedValue([mockProduct]);

      await expect(couponService.create(createCouponDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all coupons', async () => {
      const mockCoupons = [mockCoupon];
      couponRepository.find.mockResolvedValue(mockCoupons);

      const result = await couponService.findAll();

      expect(couponRepository.find).toHaveBeenCalledWith({
        relations: ['applicableProducts'],
      });
      expect(result).toEqual(mockCoupons);
    });
  });

  describe('findOne', () => {
    it('should return a coupon by id', async () => {
      couponRepository.findOne.mockResolvedValue(mockCoupon);

      const result = await couponService.findOne(mockCouponId);

      expect(couponRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCouponId },
        relations: ['applicableProducts'],
      });
      expect(result).toEqual(mockCoupon);
    });

    it('should throw NotFoundException if coupon does not exist', async () => {
      couponRepository.findOne.mockResolvedValue(null);

      await expect(couponService.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByCode', () => {
    it('should return a coupon by code', async () => {
      couponRepository.findOne.mockResolvedValue(mockCoupon);

      const result = await couponService.findByCode(mockCouponCode);

      expect(couponRepository.findOne).toHaveBeenCalledWith({
        where: { code: mockCouponCode },
        relations: ['applicableProducts'],
      });
      expect(result).toEqual(mockCoupon);
    });

    it('should throw NotFoundException if coupon does not exist', async () => {
      couponRepository.findOne.mockResolvedValue(null);

      await expect(couponService.findByCode('NON-EXISTENT')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a coupon successfully', async () => {
      const updateCouponDto: UpdateCouponDto = {
        description: 'Updated description',
        isActive: false,
      };

      couponRepository.findOne.mockResolvedValueOnce(mockCoupon);
      couponRepository.save.mockResolvedValue({
        ...mockCoupon,
        ...updateCouponDto,
      });

      const result = await couponService.update(mockCouponId, updateCouponDto);

      expect(couponRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCouponId },
        relations: ['applicableProducts'],
      });
      expect(couponRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        ...mockCoupon,
        ...updateCouponDto,
      });
    });

    it('should throw ConflictException if updating to existing code', async () => {
      const updateCouponDto: UpdateCouponDto = {
        code: 'EXISTING-CODE',
      };

      couponRepository.findOne.mockResolvedValueOnce(mockCoupon);
      couponRepository.findOne.mockResolvedValueOnce({ code: 'EXISTING-CODE' });

      await expect(couponService.update(mockCouponId, updateCouponDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a coupon successfully', async () => {
      couponRepository.delete.mockResolvedValue({ affected: 1 });

      await couponService.remove(mockCouponId);

      expect(couponRepository.delete).toHaveBeenCalledWith(mockCouponId);
    });

    it('should throw NotFoundException if coupon does not exist', async () => {
      couponRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(couponService.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('validateCoupon', () => {
    it('should validate a valid coupon', async () => {
      couponRepository.findOne.mockResolvedValue(mockCoupon);
      mockCoupon.isValid.mockReturnValue(true);
      mockCoupon.calculateDiscount.mockImplementation((amount) => amount * 0.1);

      const result = await couponService.validateCoupon(mockCouponCode, 200);

      expect(result).toEqual({
        isValid: true,
        discount: 20, // 10% of 200
        message: 'Discount of 20 applied',
      });
    });

    it('should return invalid if coupon is not valid', async () => {
      couponRepository.findOne.mockResolvedValue({
        ...mockCoupon,
        isValid: jest.fn().mockReturnValue(false),
      });

      const result = await couponService.validateCoupon(mockCouponCode, 200);

      expect(result).toEqual({
        isValid: false,
        discount: 0,
        message:
          'Coupon is not valid (expired, inactive, or usage limit reached)',
      });
    });

    it('should handle non-existent coupon', async () => {
      couponRepository.findOne.mockImplementation(() => {
        throw new NotFoundException('Invalid coupon code');
      });

      const result = await couponService.validateCoupon('NON-EXISTENT', 200);

      expect(result).toEqual({
        isValid: false,
        discount: 0,
        message: 'Invalid coupon code',
      });
    });
  });

  describe('incrementUsageCount', () => {
    it('should increment the usage count of a coupon', async () => {
      const coupon = {
        ...mockCoupon,
        usageCount: 5,
      };

      couponRepository.findOne.mockResolvedValue(coupon);
      couponRepository.save.mockResolvedValue({
        ...coupon,
        usageCount: 6,
      });

      await couponService.incrementUsageCount(mockCouponCode);

      expect(couponRepository.findOne).toHaveBeenCalledWith({
        where: { code: mockCouponCode },
        relations: ['applicableProducts'],
      });
      expect(couponRepository.save).toHaveBeenCalledWith({
        ...coupon,
        usageCount: 6,
      });
    });
  });
});
