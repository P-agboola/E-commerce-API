import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CartItem } from '../schemas/cart.schema';

export class AddToCartItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Product variant ID', required: false })
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiProperty({ description: 'Quantity to add to cart', default: 1 })
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    description: 'Additional item attributes',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  attributes?: Record<string, any>;
}

export class UpdateCartItemDto {
  @ApiProperty({ description: 'Item index in cart', required: true })
  @IsString()
  itemId: string;

  @ApiProperty({ description: 'New quantity' })
  quantity: number;
}

export class CreateCartDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Session ID for guest carts', required: false })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiProperty({ description: 'Cart items', type: [CartItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItem)
  @IsOptional()
  items?: CartItem[];
}
