import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentProvider } from '../entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Order ID associated with this payment' })
  @IsNotEmpty()
  @IsUUID()
  orderId: string;

  @ApiProperty({ description: 'Payment amount', example: 99.99 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Payment provider',
    enum: PaymentProvider,
    example: PaymentProvider.STRIPE,
  })
  @IsNotEmpty()
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @ApiPropertyOptional({ description: 'Additional payment details' })
  @IsOptional()
  paymentDetails?: Record<string, any>;

  // For Stripe
  @ApiPropertyOptional({ description: 'Payment method ID (for Stripe)' })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiPropertyOptional({ description: 'Stripe payment intent ID' })
  @IsOptional()
  @IsString()
  paymentIntentId?: string;

  // For PayPal
  @ApiPropertyOptional({ description: 'PayPal order ID' })
  @IsOptional()
  @IsString()
  paypalOrderId?: string;
}
