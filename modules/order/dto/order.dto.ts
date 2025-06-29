import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsUUID,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../../../common/enums/order-status.enum';

export class OrderItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Product variant ID', required: false })
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiProperty({ description: 'Product name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Product price' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Product image', required: false })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({ description: 'Product attributes', required: false })
  @IsOptional()
  attributes?: Record<string, any>;
}

export class AddressDto {
  @ApiProperty({ description: 'Full name' })
  @IsString()
  fullName: string;

  @ApiProperty({ description: 'Address line 1' })
  @IsString()
  addressLine1: string;

  @ApiProperty({ description: 'Address line 2', required: false })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'State' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'Postal/ZIP code' })
  @IsString()
  postalCode: string;

  @ApiProperty({ description: 'Country' })
  @IsString()
  country: string;

  @ApiProperty({ description: 'Phone number' })
  @IsString()
  phone: string;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Order items', type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ description: 'Shipping address' })
  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress: AddressDto;

  @ApiProperty({ description: 'Billing address', required: false })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  billingAddress?: AddressDto;

  @ApiProperty({
    description: 'Use shipping address as billing address',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  sameAsShipping?: boolean;

  @ApiProperty({ description: 'Payment method', example: 'credit_card' })
  @IsString()
  paymentMethod: string;

  @ApiProperty({ description: 'Coupon code', required: false })
  @IsString()
  @IsOptional()
  couponCode?: string;

  @ApiProperty({ description: 'Additional order notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateOrderDto {
  @ApiProperty({
    description: 'Order status',
    enum: OrderStatus,
    required: false,
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiProperty({ description: 'Payment ID', required: false })
  @IsString()
  @IsOptional()
  paymentId?: string;

  @ApiProperty({ description: 'Payment completed', required: false })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiProperty({ description: 'Payment date', required: false })
  @IsOptional()
  paidAt?: Date;

  @ApiProperty({ description: 'Shipping date', required: false })
  @IsOptional()
  shippedAt?: Date;

  @ApiProperty({ description: 'Delivery date', required: false })
  @IsOptional()
  deliveredAt?: Date;

  @ApiProperty({ description: 'Cancellation date', required: false })
  @IsOptional()
  cancelledAt?: Date;

  @ApiProperty({ description: 'Cancellation reason', required: false })
  @IsString()
  @IsOptional()
  cancelReason?: string;
}
