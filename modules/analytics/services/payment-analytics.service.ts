import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaymentEntity,
  PaymentProvider,
  PaymentStatus,
} from '../../payment/entities/payment.entity';

// Exported interfaces to be used by other modules
export interface PaymentStats {
  total: number;
  succeeded: number;
  failed: number;
  refunded: number;
  successRate: number;
}

export interface PaymentMethodStats {
  provider: PaymentProvider;
  count: number;
  percentage: number;
  totalAmount: number;
  averageAmount: number;
}

@Injectable()
export class PaymentAnalyticsService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
  ) {}

  async getPaymentStats(
    startDate?: Date,
    endDate?: Date,
  ): Promise<PaymentStats> {
    // Create base query
    let query = this.paymentRepository.createQueryBuilder('payment');

    // Add date filters if provided
    if (startDate) {
      query = query.andWhere('payment.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query = query.andWhere('payment.createdAt <= :endDate', { endDate });
    }

    // Get total payments
    const total = await query.getCount();

    // Get succeeded payments
    const succeeded = await query
      .clone()
      .andWhere('payment.status = :status', { status: PaymentStatus.SUCCEEDED })
      .getCount();

    // Get failed payments
    const failed = await query
      .clone()
      .andWhere('payment.status = :status', { status: PaymentStatus.FAILED })
      .getCount();

    // Get refunded payments (includes both full and partial refunds)
    const refunded = await query
      .clone()
      .andWhere('payment.status IN (:...statuses)', {
        statuses: [PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED],
      })
      .getCount();

    // Calculate success rate
    const successRate = total > 0 ? (succeeded / total) * 100 : 0;

    return {
      total,
      succeeded,
      failed,
      refunded,
      successRate,
    };
  }

  async getPaymentMethodBreakdown(
    startDate?: Date,
    endDate?: Date,
  ): Promise<PaymentMethodStats[]> {
    // Create base query
    let query = this.paymentRepository.createQueryBuilder('payment');

    // Add date filters if provided
    if (startDate) {
      query = query.andWhere('payment.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query = query.andWhere('payment.createdAt <= :endDate', { endDate });
    }

    // Get total count for percentage calculation
    const totalCount = await query.getCount();

    if (totalCount === 0) {
      return [];
    }

    // Get stats grouped by provider
    const stats = await query
      .select('payment.provider', 'provider')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(payment.amount)', 'totalAmount')
      .addSelect('AVG(payment.amount)', 'averageAmount')
      .groupBy('payment.provider')
      .getRawMany();

    // Calculate percentages and format results
    return stats.map((stat) => ({
      provider: stat.provider,
      count: parseInt(stat.count, 10),
      percentage: (parseInt(stat.count, 10) / totalCount) * 100,
      totalAmount: parseFloat(stat.totalAmount),
      averageAmount: parseFloat(stat.averageAmount),
    }));
  }

  async getRefundRate(startDate?: Date, endDate?: Date): Promise<number> {
    // Create base query for all completed transactions
    let query = this.paymentRepository
      .createQueryBuilder('payment')
      .andWhere('payment.status IN (:...statuses)', {
        statuses: [
          PaymentStatus.SUCCEEDED,
          PaymentStatus.REFUNDED,
          PaymentStatus.PARTIALLY_REFUNDED,
        ],
      });

    // Add date filters if provided
    if (startDate) {
      query = query.andWhere('payment.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query = query.andWhere('payment.createdAt <= :endDate', { endDate });
    }

    // Get total completed payments (succeeded + refunded)
    const totalCompleted = await query.getCount();

    if (totalCompleted === 0) {
      return 0;
    }

    // Get refunded payments
    const refunded = await query
      .clone()
      .andWhere('payment.status IN (:...refundStatuses)', {
        refundStatuses: [
          PaymentStatus.REFUNDED,
          PaymentStatus.PARTIALLY_REFUNDED,
        ],
      })
      .getCount();

    // Calculate refund rate
    return (refunded / totalCompleted) * 100;
  }

  async getAverageTransactionValue(
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    // Create base query for successful payments
    let query = this.paymentRepository
      .createQueryBuilder('payment')
      .andWhere('payment.status = :status', {
        status: PaymentStatus.SUCCEEDED,
      });

    // Add date filters if provided
    if (startDate) {
      query = query.andWhere('payment.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query = query.andWhere('payment.createdAt <= :endDate', { endDate });
    }

    // Get average transaction value
    const result = await query
      .select('AVG(payment.amount)', 'average')
      .getRawOne();

    return result ? parseFloat(result.average) : 0;
  }
}
