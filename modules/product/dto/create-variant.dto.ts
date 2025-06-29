import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '../entities/product.entity';

export class VariantOptionDto {
  @ApiProperty({ description: 'Option name (e.g., "Color")' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Option value (e.g., "Red")' })
  @IsString()
  value: string;

  @ApiProperty({ description: 'Option image URL', required: false })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({
    description: 'Additional price for this option',
    minimum: 0,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  additionalPrice?: number;
}

export class CreateProductVariantDto {
  @ApiProperty({ description: 'Product ID this variant belongs to' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Variant name (e.g., "Red XL")' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Variant SKU', required: false })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiProperty({ description: 'Variant barcode', required: false })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiProperty({ description: 'Variant price', minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Variant discount price',
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountPrice?: number;

  @ApiProperty({ description: 'Variant quantity', minimum: 0, default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    description: 'Variant images URLs',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ description: 'Variant options', type: [VariantOptionDto] })
  @ValidateNested({ each: true })
  @Type(() => VariantOptionDto)
  @IsArray()
  options: VariantOptionDto[];

  @ApiProperty({
    description: 'Variant attributes',
    additionalProperties: true,
    example: { weight: '250g' },
  })
  @IsOptional()
  attributes?: Record<string, any>;

  @ApiProperty({ description: 'Is variant active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
