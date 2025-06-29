import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus } from '../entities/payment.entity';

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  paymentIntentId?: string;
  status: PaymentStatus;
  details?: Record<string, any>;
  errorMessage?: string;
}

// Base interface for all payment providers
export interface PaymentStrategy {
  createPayment(
    amount: number,
    metadata: Record<string, any>,
  ): Promise<PaymentResult>;
  processPayment(paymentData: any): Promise<PaymentResult>;
  refundPayment(transactionId: string, amount?: number): Promise<PaymentResult>;
  verifyWebhook(payload: any, signature: string): Promise<boolean>;
}
