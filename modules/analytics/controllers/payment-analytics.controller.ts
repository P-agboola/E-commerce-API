import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentAnalyticsService } from '../services/payment-analytics.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';

@ApiTags('payment-analytics')
@Controller('analytics/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class PaymentAnalyticsController {
  constructor(
    private readonly paymentAnalyticsService: PaymentAnalyticsService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get payment statistics' })
  @ApiResponse({ status: 200, description: 'Returns payment statistics' })
  async getPaymentStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;

    return this.paymentAnalyticsService.getPaymentStats(
      startDateObj,
      endDateObj,
    );
  }

  @Get('methods')
  @ApiOperation({ summary: 'Get payment method breakdown' })
  @ApiResponse({
    status: 200,
    description: 'Returns payment method statistics',
  })
  async getPaymentMethodBreakdown(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;

    return this.paymentAnalyticsService.getPaymentMethodBreakdown(
      startDateObj,
      endDateObj,
    );
  }

  @Get('refund-rate')
  @ApiOperation({ summary: 'Get refund rate' })
  @ApiResponse({
    status: 200,
    description: 'Returns refund rate as a percentage',
  })
  async getRefundRate(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;

    return {
      refundRate: await this.paymentAnalyticsService.getRefundRate(
        startDateObj,
        endDateObj,
      ),
    };
  }

  @Get('average-value')
  @ApiOperation({ summary: 'Get average transaction value' })
  @ApiResponse({
    status: 200,
    description: 'Returns average transaction value',
  })
  async getAverageTransactionValue(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;

    return {
      averageValue:
        await this.paymentAnalyticsService.getAverageTransactionValue(
          startDateObj,
          endDateObj,
        ),
    };
  }
}
