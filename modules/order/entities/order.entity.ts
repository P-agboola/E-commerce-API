import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BaseEntity } from '../../../lib/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { OrderStatus } from '../../../common/enums/order-status.enum';

@Entity('orders')
export class Order extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ unique: true })
  orderNumber: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2 })
  tax: number;

  @Column('decimal', { precision: 10, scale: 2 })
  shipping: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  // Computed property for payment service
  get totalAmount(): number {
    return this.total;
  }

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ nullable: true })
  couponCode?: string;

  @Column({ nullable: true })
  shippingAddress: string;

  @Column({ nullable: true })
  billingAddress: string;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  paymentId: string;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ nullable: true })
  shippedAt: Date;

  @Column({ nullable: true })
  deliveredAt: Date;

  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancelReason: string;

  @Column('json', { nullable: true })
  metadata: Record<string, any>;

  // Virtual field for order items
  items: any[];
}

@Entity('order_items')
export class OrderItem extends BaseEntity {
  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ nullable: true })
  variantId?: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('int')
  quantity: number;

  @Column({ nullable: true })
  image?: string;

  @Column('json', { nullable: true })
  attributes: Record<string, any>;
}
