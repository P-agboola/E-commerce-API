import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop()
  image?: string;

  @Prop({ type: String, ref: 'Category', default: null })
  parentId: string | null;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Add indexes for better performance
CategorySchema.index({ name: 'text', description: 'text' });
CategorySchema.index({ slug: 1 });
CategorySchema.index({ parentId: 1 });
