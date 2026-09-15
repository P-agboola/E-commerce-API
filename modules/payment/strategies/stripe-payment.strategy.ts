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

  /**
   * Confirms a previously created payment intent.
   *
   * Confirmation is not a yes/no operation: a card can succeed, be declined,
   * or come back needing 3-D Secure authentication from the shopper. All three
   * are returned as a PaymentResult so the caller never has to catch to learn
   * the outcome — `status` carries the state, and `details.requiresAction`
   * plus `details.clientSecret` tell the client when to finish authentication.
   */
  async processPayment(paymentData: any): Promise<PaymentResult> {
    const { paymentIntentId, paymentMethodId, returnUrl } = paymentData ?? {};

    if (!paymentIntentId) {
      return {
        success: false,
        status: PaymentStatus.FAILED,
        errorMessage: 'paymentIntentId is required to process a payment',
      };
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        {
          ...(paymentMethodId ? { payment_method: paymentMethodId } : {}),
          // Stripe requires a return_url for payment methods that redirect
          // (3-D Secure, most wallets). Omitted for plain card confirmations.
          ...(returnUrl ? { return_url: returnUrl } : {}),
        },
      );

      const status = this.mapIntentStatus(paymentIntent.status);
      const requiresAction = paymentIntent.status === 'requires_action';

      return {
        success: status !== PaymentStatus.FAILED,
        transactionId: this.extractChargeId(paymentIntent),
        paymentIntentId: paymentIntent.id,
        status,
        details: {
          stripeStatus: paymentIntent.status,
          paymentMethod: paymentMethodId ?? paymentIntent.payment_method,
          requiresAction,
          // Only surfaced when the shopper still has to act on it.
          clientSecret: requiresAction ? paymentIntent.client_secret : undefined,
          nextAction: paymentIntent.next_action?.type,
        },
        errorMessage:
          status === PaymentStatus.FAILED
            ? (paymentIntent.last_payment_error?.message ??
              'Payment could not be completed')
            : undefined,
      };
    } catch (error: any) {
      // A declined card arrives here as a StripeCardError rather than a
      // rejected intent, so it is translated into the same shape as every
      // other outcome. Anything that is not a card error is an integration
      // or network problem and is reported as FAILED with Stripe's message.
      const isCardError = error?.type === 'StripeCardError';

      return {
        success: false,
        paymentIntentId,
        status: PaymentStatus.FAILED,
        details: {
          stripeErrorType: error?.type,
          declineCode: isCardError ? error?.decline_code : undefined,
          code: error?.code,
        },
        errorMessage: error?.message ?? 'Failed to process payment',
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

  /**
   * Translates Stripe's intent lifecycle into the provider-neutral status the
   * rest of the application stores. Kept as an explicit map so a new Stripe
   * state fails loudly in review instead of silently reading as a success.
   */
  private mapIntentStatus(
    stripeStatus: Stripe.PaymentIntent.Status,
  ): PaymentStatus {
    switch (stripeStatus) {
      case 'succeeded':
        return PaymentStatus.SUCCEEDED;
      case 'processing':
        return PaymentStatus.PROCESSING;
      // Funds are authorised but not yet captured - money is committed, so
      // this is in flight rather than pending shopper input.
      case 'requires_capture':
        return PaymentStatus.PROCESSING;
      // Waiting on the shopper (3-D Secure) or on a further confirm call.
      case 'requires_action':
      case 'requires_confirmation':
        return PaymentStatus.PENDING;
      // Stripe rewinds to this state when the card is rejected during confirm.
      case 'requires_payment_method':
        return PaymentStatus.FAILED;
      case 'canceled':
        return PaymentStatus.CANCELLED;
      default:
        return PaymentStatus.FAILED;
    }
  }

  /**
   * `latest_charge` is the id the money actually moved under, and is what we
   * persist as the transaction id. Stripe returns it either expanded or as a
   * bare id depending on the request, so both shapes are handled.
   */
  private extractChargeId(
    paymentIntent: Stripe.PaymentIntent,
  ): string | undefined {
    const charge = paymentIntent.latest_charge;

    if (!charge) {
      return undefined;
    }

    return typeof charge === 'string' ? charge : charge.id;
  }
}
