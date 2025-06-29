import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsUUID,
  IsOptional,
  IsEnum,
  IsArray,
  Min,
  Max,
  Length,
} from 'class-validator';
import { ReviewStatus } from '../entities/review.entity';

export class CreateReviewDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Review rating (1-5)', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Review comment' })
  @IsString()
  @Length(3, 1000)
  comment: string;

  @ApiProperty({
    description: 'Review images',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({
    description: 'Order ID related to this review',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  orderId?: string;
}

export class UpdateReviewDto {
  @ApiProperty({
    description: 'Review rating (1-5)',
    minimum: 1,
    maximum: 5,
    required: false,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiProperty({ description: 'Review comment', required: false })
  @IsString()
  @Length(3, 1000)
  @IsOptional()
  comment?: string;

  @ApiProperty({
    description: 'Review images',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({
    description: 'Review status',
    enum: ReviewStatus,
    required: false,
  })
  @IsEnum(ReviewStatus)
  @IsOptional()
  status?: ReviewStatus;
}

export class ReviewFilterDto {
  @ApiProperty({ description: 'Product ID', required: false })
  @IsUUID()
  @IsOptional()
  productId?: string;

  @ApiProperty({ description: 'User ID', required: false })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({ description: 'Minimum rating', required: false })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  minRating?: number;

  @ApiProperty({
    description: 'Review status',
    enum: ReviewStatus,
    required: false,
  })
  @IsEnum(ReviewStatus)
  @IsOptional()
  status?: ReviewStatus;

  @ApiProperty({
    description: 'Only verified purchases',
    required: false,
    default: false,
  })
  @IsOptional()
  verifiedOnly?: boolean;
}
