import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ProductVariantDocument = ProductVariant & Document;

@Schema({ timestamps: true })
export class VariantOption {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  value: string;

  @Prop()
  image?: string;

  @Prop({ type: Number, default: 0 })
  additionalPrice: number;
}

@Schema({ timestamps: true })
export class ProductVariant {
  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  sku?: string;

  @Prop()
  barcode?: string;

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({ type: Number, default: 0 })
  discountPrice: number;

  @Prop({ type: Number, default: 0 })
  quantity: number;

  @Prop({ type: [String] })
  images: string[];

  @Prop({ type: [{ type: MongooseSchema.Types.Mixed }] })
  options: VariantOption[];

  @Prop({ type: MongooseSchema.Types.Mixed })
  attributes: Record<string, any>;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const ProductVariantSchema =
  SchemaFactory.createForClass(ProductVariant);

// Add indexes
ProductVariantSchema.index({ productId: 1 });
ProductVariantSchema.index({ name: 'text' });
ProductVariantSchema.index({ sku: 1 }, { unique: true, sparse: true });
