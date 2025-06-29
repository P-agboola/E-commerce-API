import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type CartItemDocument = CartItem & Document;

@Schema()
export class CartItem {
  @ApiProperty({ description: 'Product ID' })
  @Prop({ required: true })
  productId: string;

  @ApiProperty({ description: 'Product variant ID', required: false })
  @Prop()
  variantId?: string;

  @ApiProperty({ description: 'Product name' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: 'Product image' })
  @Prop()
  image?: string;

  @ApiProperty({ description: 'Item price' })
  @Prop({ required: true, type: Number })
  price: number;

  @ApiProperty({ description: 'Quantity' })
  @Prop({ required: true, type: Number, min: 1, default: 1 })
  quantity: number;

  @ApiProperty({
    description: 'Additional item attributes',
    type: 'object',
    additionalProperties: true,
  })
  @Prop({ type: Object })
  attributes?: Record<string, any>;
}

export type CartDocument = Cart & Document;

@Schema({ timestamps: true })
export class Cart {
  @ApiProperty({ description: 'MongoDB ID field' })
  _id: string;

  @ApiProperty({ description: 'User ID' })
  @Prop({ required: true })
  userId: string;

  @ApiProperty({ description: 'Session ID for guest carts', required: false })
  @Prop()
  sessionId?: string;

  @ApiProperty({ description: 'Cart items', type: [CartItem] })
  @Prop({ type: [Object], default: [] })
  items: CartItem[];

  @ApiProperty({ description: 'Cart active status' })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Cart expiry date for guest carts',
    required: false,
  })
  @Prop()
  expiresAt?: Date;

  @ApiProperty({
    description: 'Additional cart metadata',
    type: 'object',
    additionalProperties: true,
  })
  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

// Add indexes
CartSchema.index({ userId: 1 });
CartSchema.index({ sessionId: 1 });
CartSchema.index({ createdAt: 1 });
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for expired carts
