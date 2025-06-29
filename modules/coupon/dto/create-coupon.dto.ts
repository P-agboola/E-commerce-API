import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDate,
  IsArray,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountType } from '../entities/coupon.entity';

export class CreateCouponDto {
  @ApiProperty({ description: 'Unique coupon code', example: 'SUMMER2025' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  code: string;

  @ApiPropertyOptional({
    description: 'Coupon description',
    example: 'Summer sale discount',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Type of discount',
    enum: DiscountType,
    example: DiscountType.PERCENTAGE,
  })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({
    description: 'Discount value (percentage or fixed amount)',
    example: 10,
  })
  @IsNumber()
  @Min(0)
  @Max(100, { message: 'Discount percentage cannot exceed 100%' })
  discountValue: number;

  @ApiPropertyOptional({
    description: 'Minimum purchase amount required to use this coupon',
    example: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumPurchaseAmount?: number;

  @ApiPropertyOptional({
    description: 'Maximum discount amount that can be applied',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumDiscountAmount?: number;

  @ApiPropertyOptional({
    description: 'Whether the coupon is currently active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Start date of the coupon validity',
    example: '2025-06-01',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'End date of the coupon validity',
    example: '2025-08-31',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({
    description:
      'Maximum number of times this coupon can be used (0 = unlimited)',
    default: 0,
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  usageLimit?: number;

  @ApiPropertyOptional({
    description:
      'List of product IDs this coupon applies to (empty = all products)',
    example: ['product-id-1', 'product-id-2'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  applicableProductIds?: string[];
}
