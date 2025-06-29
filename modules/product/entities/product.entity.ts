import { Entity, Column, ManyToOne, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../../lib/entities/base.entity';
import { User } from '../../user/entities/user.entity';

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
}

@Entity('products')
export class Product extends BaseEntity {
  @Column()
  @Index({ fulltext: true })
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discountPrice: number;

  @Column('int', { default: 0 })
  quantity: number;

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column('simple-array', { nullable: true })
  categories: string[];

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.DRAFT })
  status: ProductStatus;

  @Column('boolean', { default: false })
  featured: boolean;

  @Column('int', { default: 0 })
  rating: number;

  @Column('int', { default: 0 })
  reviewCount: number;

  @Column('json', { nullable: true })
  attributes: Record<string, any>;

  @Column('varchar', { length: 100, nullable: true })
  sku: string;

  @Column('varchar', { length: 100, nullable: true })
  barcode: string;

  @Column({ type: 'uuid' })
  sellerId: string;

  @ManyToOne(() => User)
  seller: User;

  // Virtual field to calculate discount percentage
  get discountPercentage(): number {
    if (!this.discountPrice || this.price <= 0) {
      return 0;
    }
    return Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }

  // Virtual field to check if product is on sale
  get isOnSale(): boolean {
    return this.discountPrice > 0 && this.discountPrice < this.price;
  }

  // Virtual field to check if product is in stock
  get isInStock(): boolean {
    return this.quantity > 0 && this.status === ProductStatus.ACTIVE;
  }
}
