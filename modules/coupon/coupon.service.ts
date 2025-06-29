import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CouponEntity } from './entities/coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Product } from '../product/entities/product.entity';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(CouponEntity)
    private readonly couponRepository: Repository<CouponEntity>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createCouponDto: CreateCouponDto): Promise<CouponEntity> {
    // Check if coupon with the same code already exists
    const existingCoupon = await this.couponRepository.findOne({
      where: { code: createCouponDto.code },
    });

    if (existingCoupon) {
      throw new ConflictException(
        `Coupon with code ${createCouponDto.code} already exists`,
      );
    }

    // Create new coupon entity
    const coupon = this.couponRepository.create(createCouponDto);

    // Set applicable products if provided
    if (
      createCouponDto.applicableProductIds &&
      createCouponDto.applicableProductIds.length > 0
    ) {
      const products = await this.productRepository.findByIds(
        createCouponDto.applicableProductIds,
      );

      if (products.length !== createCouponDto.applicableProductIds.length) {
        throw new BadRequestException(
          'Some of the provided product IDs do not exist',
        );
      }

      coupon.applicableProducts = products;
    }

    return this.couponRepository.save(coupon);
  }

  async findAll(): Promise<CouponEntity[]> {
    return this.couponRepository.find({
      relations: ['applicableProducts'],
    });
  }

  async findOne(id: string): Promise<CouponEntity> {
    const coupon = await this.couponRepository.findOne({
      where: { id },
      relations: ['applicableProducts'],
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    return coupon;
  }

  async findByCode(code: string): Promise<CouponEntity> {
    const coupon = await this.couponRepository.findOne({
      where: { code },
      relations: ['applicableProducts'],
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with code ${code} not found`);
    }

    return coupon;
  }

  async update(
    id: string,
    updateCouponDto: UpdateCouponDto,
  ): Promise<CouponEntity> {
    const coupon = await this.findOne(id);

    // Check if trying to update code to one that already exists
    if (updateCouponDto.code && updateCouponDto.code !== coupon.code) {
      const existingCoupon = await this.couponRepository.findOne({
        where: { code: updateCouponDto.code },
      });

      if (existingCoupon) {
        throw new ConflictException(
          `Coupon with code ${updateCouponDto.code} already exists`,
        );
      }
    }

    // Update applicable products if provided
    if (updateCouponDto.applicableProductIds) {
      const products = await this.productRepository.findByIds(
        updateCouponDto.applicableProductIds,
      );

      if (products.length !== updateCouponDto.applicableProductIds.length) {
        throw new BadRequestException(
          'Some of the provided product IDs do not exist',
        );
      }

      coupon.applicableProducts = products;

      // Remove applicableProductIds from DTO as we handle it separately
      delete updateCouponDto.applicableProductIds;
    }

    // Update other properties
    Object.assign(coupon, updateCouponDto);

    return this.couponRepository.save(coupon);
  }

  async remove(id: string): Promise<void> {
    const result = await this.couponRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }
  }

  async validateCoupon(
    code: string,
    orderAmount: number,
    productIds?: string[],
  ): Promise<{ isValid: boolean; discount: number; message?: string }> {
    try {
      const coupon = await this.findByCode(code);

      // Check if coupon is valid
      if (!coupon.isValid()) {
        return {
          isValid: false,
          discount: 0,
          message:
            'Coupon is not valid (expired, inactive, or usage limit reached)',
        };
      }

      // Check if coupon applies to specific products
      if (coupon.applicableProducts?.length > 0 && productIds?.length > 0) {
        const applicableProductIds = coupon.applicableProducts.map(
          (product) => product.id,
        );
        const hasApplicableProduct = productIds.some((id) =>
          applicableProductIds.includes(id),
        );

        if (!hasApplicableProduct) {
          return {
            isValid: false,
            discount: 0,
            message:
              'Coupon is not applicable to any of the products in your cart',
          };
        }
      }

      const discount = coupon.calculateDiscount(orderAmount);

      return {
        isValid: discount > 0,
        discount,
        message:
          discount > 0
            ? `Discount of ${discount} applied`
            : 'No discount applied',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return { isValid: false, discount: 0, message: 'Invalid coupon code' };
      }
      throw error;
    }
  }

  async incrementUsageCount(code: string): Promise<void> {
    const coupon = await this.findByCode(code);
    coupon.usageCount += 1;
    await this.couponRepository.save(coupon);
  }
}
