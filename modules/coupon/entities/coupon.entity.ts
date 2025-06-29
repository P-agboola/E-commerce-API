import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from '../../../lib/entities/base.entity';
import { Product } from '../../product/entities/product.entity';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
}

@Entity('coupons')
export class CouponEntity extends BaseEntity {
  @Column({ unique: true })
  code: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: DiscountType,
    default: DiscountType.PERCENTAGE,
  })
  discountType: DiscountType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discountValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minimumPurchaseAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maximumDiscountAmount: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ default: 0 })
  usageLimit: number;

  @Column({ default: 0 })
  usageCount: number;

  @ManyToMany(() => Product)
  @JoinTable({
    name: 'coupon_products',
    joinColumn: { name: 'coupon_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'product_id', referencedColumnName: 'id' },
  })
  applicableProducts: Product[];

  // Helper methods
  isValid(): boolean {
    const now = new Date();

    // Check if coupon is active
    if (!this.isActive) return false;

    // Check if coupon has reached usage limit
    if (this.usageLimit > 0 && this.usageCount >= this.usageLimit) return false;

    // Check if coupon is within date range
    if (this.startDate && this.startDate > now) return false;
    if (this.endDate && this.endDate < now) return false;

    return true;
  }

  calculateDiscount(orderAmount: number): number {
    // If minimum purchase amount is set and order amount is less, no discount
    if (
      this.minimumPurchaseAmount &&
      orderAmount < this.minimumPurchaseAmount
    ) {
      return 0;
    }

    let discount = 0;

    if (this.discountType === DiscountType.PERCENTAGE) {
      discount = orderAmount * (this.discountValue / 100);
    } else {
      discount = this.discountValue;
    }

    // Apply maximum discount cap if set
    if (this.maximumDiscountAmount && discount > this.maximumDiscountAmount) {
      discount = this.maximumDiscountAmount;
    }

    return discount;
  }
}
