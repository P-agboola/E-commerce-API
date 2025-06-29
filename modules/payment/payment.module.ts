import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentEntity } from './entities/payment.entity';
import { StripePaymentStrategy } from './strategies/stripe-payment.strategy';
import { PaypalPaymentStrategy } from './strategies/paypal-payment.strategy';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentEntity]), OrderModule],
  controllers: [PaymentController],
  providers: [PaymentService, StripePaymentStrategy, PaypalPaymentStrategy],
  exports: [PaymentService],
})
export class PaymentModule {}
