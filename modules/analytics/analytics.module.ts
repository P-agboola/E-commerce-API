import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PaymentEntity } from '../payment/entities/payment.entity';
import { PaymentAnalyticsService } from './services/payment-analytics.service';
import { PaymentAnalyticsController } from './controllers/payment-analytics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentEntity])],
  controllers: [AnalyticsController, PaymentAnalyticsController],
  providers: [AnalyticsService, PaymentAnalyticsService],
  exports: [AnalyticsService, PaymentAnalyticsService],
})
export class AnalyticsModule {}
