import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStrategy, PaymentResult } from './payment-strategy.interface';
import { PaymentStatus } from '../entities/payment.entity';
import Stripe from 'stripe';

@Injectable()
export class StripePaymentStrategy implements PaymentStrategy {
  private readonly secretKey: string;
  private readonly webhookSecret: string;
  private readonly stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('payment.stripe.secretKey');
    this.webhookSecret = this.configService.get<string>(
      'payment.stripe.webhookSecret',
    );

    // Initialize Stripe with API key
    this.stripe = new Stripe(this.secretKey, {
      apiVersion: '2025-05-28.basil',
    });
  }

  async createPayment(
    amount: number,
    metadata: Record<string, any>,
  ): Promise<PaymentResult> {
    try {
      // Create a payment intent with Stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        metadata,
      });

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        status: PaymentStatus.PENDING,
        details: {
          clientSecret: paymentIntent.client_secret,
        },
      };
    } catch (error) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        errorMessage: error.message || 'Failed to create payment intent',
      };
    }
  }

  async processPayment(paymentData: any): Promise<PaymentResult> {
    try {
      const { paymentIntentId, paymentMethodId } = paymentData;

      // In a real implementation, you would confirm the payment intent
      // const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
      //   payment_method: paymentMethodId,
      // });

      // Mock implementation
      const mockTransactionId = `txn_${Date.now()}`;

      return {
        success: true,
        transactionId: mockTransactionId,
        paymentIntentId,
        status: PaymentStatus.SUCCEEDED,
        details: {
          paymentMethod: paymentMethodId,
        },
      };
    } catch (error) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        errorMessage: error.message || 'Failed to process payment',
      };
    }
  }

  async refundPayment(
    transactionId: string,
    amount?: number,
  ): Promise<PaymentResult> {
    try {
      // Process the refund via Stripe API
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: transactionId,
      };

      // If amount is specified, it's a partial refund
      if (amount) {
        refundParams.amount = Math.round(amount * 100); // Convert to cents
      }

      const refund = await this.stripe.refunds.create(refundParams);

      // Check if this is a partial refund based on the amount parameter
      // since Stripe's refund object doesn't directly provide total payment amount
      const isPartialRefund = amount !== undefined;

      return {
        success: true,
        transactionId: refund.id,
        status: isPartialRefund
          ? PaymentStatus.PARTIALLY_REFUNDED
          : PaymentStatus.REFUNDED,
        details: {
          refundedAmount: refund.amount / 100, // Convert from cents
          reason: refund.reason,
          status: refund.status,
          paymentIntentId: refund.payment_intent,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        errorMessage: error.message ?? 'Failed to refund payment',
      };
    }
  }

  async verifyWebhook(payload: any, signature: string): Promise<boolean> {
    try {
      if (!signature) {
        throw new Error('Stripe signature is required');
      }

      // Verify the webhook signature - throws error if invalid
      this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret,
      );

      return true;
    } catch (error) {
      console.error('Webhook signature verification failed:', error.message);
      return false;
    }
  }
}
