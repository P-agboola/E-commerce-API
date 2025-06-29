import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type WishlistDocument = Wishlist & Document;

@Schema({ timestamps: true })
export class Wishlist {
  @ApiProperty({ description: 'MongoDB ID field' })
  _id: string;

  @ApiProperty({ description: 'User ID' })
  @Prop({ required: true, unique: true })
  userId: string;

  @ApiProperty({ description: 'Products in the wishlist' })
  @Prop({ type: [String], default: [] })
  products: string[];

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);
