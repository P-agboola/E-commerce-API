import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class WishlistDto {
  @ApiProperty({ description: 'MongoDB ID field' })
  @IsMongoId()
  _id: string;

  @ApiProperty({ description: 'User ID' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Array of product IDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  products: string[];

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class WishlistResponseDto extends WishlistDto {
  @ApiProperty({
    description: 'Array of product objects with expanded details',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        images: { type: 'array', items: { type: 'string' } },
        category: { type: 'string' },
        stock: { type: 'number' },
      },
    },
  })
  products: any[];
}

export class AddToWishlistDto {
  @ApiProperty({ description: 'Product ID to add to wishlist' })
  @IsString()
  @IsNotEmpty()
  productId: string;
}
