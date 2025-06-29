import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStrategy, PaymentResult } from './payment-strategy.interface';
import { PaymentStatus } from '../entities/payment.entity';

@Injectable()
export class PaypalPaymentStrategy implements PaymentStrategy {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly mode: string;
  private readonly logger = new Logger(PaypalPaymentStrategy.name);
  private paypal: any;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('payment.paypal.clientId');
    this.clientSecret = this.configService.get<string>(
      'payment.paypal.clientSecret',
    );
    this.mode = this.configService.get<string>('payment.paypal.mode');

    // We'll initialize PayPal dynamically to avoid import issues
    this.initializePayPal();
  }

  private async initializePayPal() {
    try {
      // Dynamic import to avoid TypeScript issues
      const paypal = await import('@paypal/paypal-server-sdk');
      this.paypal = paypal.default;
      this.logger.log('PayPal SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize PayPal SDK', error);
    }
  }

  async createPayment(
    amount: number,
    metadata: Record<string, any>,
  ): Promise<PaymentResult> {
    try {
      // Wait for PayPal to be initialized
      if (!this.paypal) {
        await this.initializePayPal();
      }

      if (!this.paypal) {
        throw new Error('PayPal SDK not initialized');
      }

      // Create the PayPal client
      const environment =
        this.mode === 'live'
          ? new this.paypal.core.LiveEnvironment(
              this.clientId,
              this.clientSecret,
            )
          : new this.paypal.core.SandboxEnvironment(
              this.clientId,
              this.clientSecret,
            );

      const client = new this.paypal.core.PayPalHttpClient(environment);

      // Create an order via PayPal API
      const request = new this.paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: amount.toFixed(2),
            },
            description: metadata.description ?? 'Order payment',
            custom_id: metadata.orderId,
          },
        ],
      });

      const response = await client.execute(request);

      // Log successful API call
      this.logger.log(`PayPal order created: ${response.result.id}`);

      return {
        success: true,
        transactionId: response.result.id,
        status: PaymentStatus.PENDING,
        details: {
          approvalUrl:
            response.result.links.find((link) => link.rel === 'approve')
              ?.href || '',
        },
      };

      return {
        success: true,
        transactionId: response.result.id,
        status: PaymentStatus.PENDING,
        details: {
          approvalUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${response.result.id}`,
        },
      };
    } catch (error: any) {
      this.logger.error(
        `PayPal order creation failed: ${error.message ?? 'Unknown error'}`,
        error,
      );
      return {
        success: false,
        status: PaymentStatus.FAILED,
        errorMessage: error.message ?? 'Failed to create PayPal order',
      };
    }
  }

  async processPayment(paymentData: any): Promise<PaymentResult> {
    try {
      if (!this.paypal) {
        await this.initializePayPal();

        if (!this.paypal) {
          throw new Error('PayPal SDK not initialized');
        }
      }

      const { paypalOrderId } = paymentData;

      if (!paypalOrderId) {
        throw new Error('Missing PayPal order ID');
      }

      // Create the PayPal client
      const environment =
        this.mode === 'live'
          ? new this.paypal.core.LiveEnvironment(
              this.clientId,
              this.clientSecret,
            )
          : new this.paypal.core.SandboxEnvironment(
              this.clientId,
              this.clientSecret,
            );

      const client = new this.paypal.core.PayPalHttpClient(environment);

      // Capture the authorized payment
      const request = new this.paypal.orders.OrdersCaptureRequest(
        paypalOrderId,
      );
      request.requestBody({});
      const response = await client.execute(request);

      const captureId =
        response.result.purchase_units[0]?.payments?.captures[0]?.id;
      this.logger.log(`PayPal payment captured: ${captureId}`);

      return {
        success: true,
        transactionId: captureId ?? paypalOrderId,
        status: PaymentStatus.SUCCEEDED,
        details: {
          orderId: paypalOrderId,
          captureId: captureId,
        },
      };
    } catch (error: any) {
      this.logger.error(
        `PayPal payment capture failed: ${error.message ?? 'Unknown error'}`,
        error,
      );
      return {
        success: false,
        status: PaymentStatus.FAILED,
        errorMessage: error.message ?? 'Failed to capture PayPal payment',
      };
    }
  }

  async refundPayment(
    transactionId: string,
    amount?: number,
  ): Promise<PaymentResult> {
    try {
      if (!this.paypal) {
        await this.initializePayPal();

        if (!this.paypal) {
          throw new Error('PayPal SDK not initialized');
        }
      }

      // Create the PayPal client
      const environment =
        this.mode === 'live'
          ? new this.paypal.core.LiveEnvironment(
              this.clientId,
              this.clientSecret,
            )
          : new this.paypal.core.SandboxEnvironment(
              this.clientId,
              this.clientSecret,
            );

      const client = new this.paypal.core.PayPalHttpClient(environment);

      // Create the refund request
      const request = new this.paypal.payments.CapturesRefundRequest(
        transactionId,
      );

      // If amount is specified, it's a partial refund
      if (amount) {
        request.requestBody({
          amount: {
            currency_code: 'USD',
            value: amount.toFixed(2),
          },
        });
      } else {
        // Empty body for full refund
        request.requestBody({});
      }

      // Process the refund
      const response = await client.execute(request);

      this.logger.log(`PayPal refund processed: ${response.result.id}`);

      return {
        success: true,
        transactionId: response.result.id,
        status: amount
          ? PaymentStatus.PARTIALLY_REFUNDED
          : PaymentStatus.REFUNDED,
        details: {
          refundedAmount: amount ?? 'Full amount',
          status: response.result.status,
        },
      };
    } catch (error: any) {
      this.logger.error(
        `PayPal refund failed: ${error.message ?? 'Unknown error'}`,
        error,
      );
      return {
        success: false,
        status: PaymentStatus.FAILED,
        errorMessage: error.message ?? 'Failed to refund PayPal payment',
      };
    }
  }

  async verifyWebhook(payload: any, signature: string): Promise<boolean> {
    try {
      if (!this.paypal) {
        await this.initializePayPal();

        if (!this.paypal) {
          throw new Error('PayPal SDK not initialized');
        }
      }

      // Log the webhook event
      this.logger.log(
        `Processing PayPal webhook: ${payload.event_type ?? 'unknown event'}`,
      );

      // PayPal webhooks don't use signatures in the same way as Stripe
      // Instead, we need to validate by making an API call back to PayPal

      // Get the webhook ID from configuration
      const webhookId = this.configService.get<string>(
        'payment.paypal.webhookId',
      );

      if (!webhookId) {
        this.logger.warn('PayPal webhook ID not configured');
        return false;
      }

      // Create the PayPal client
      const environment =
        this.mode === 'live'
          ? new this.paypal.core.LiveEnvironment(
              this.clientId,
              this.clientSecret,
            )
          : new this.paypal.core.SandboxEnvironment(
              this.clientId,
              this.clientSecret,
            );

      const client = new this.paypal.core.PayPalHttpClient(environment);

      // Use the PayPal API to verify the webhook
      const webhooks = new this.paypal.notifications.WebhooksApi(client);
      const verifyResult = await webhooks.verifyWebhookSignature({
        auth_algo: payload.auth_algo,
        cert_url: payload.cert_url,
        transmission_id: payload.transmission_id,
        transmission_sig: payload.transmission_sig,
        transmission_time: payload.transmission_time,
        webhook_id: webhookId,
        webhook_event: payload.webhook_event,
      });

      return verifyResult.result?.verification_status === 'SUCCESS';
    } catch (error: any) {
      this.logger.error(
        `PayPal webhook verification failed: ${error.message ?? 'Unknown error'}`,
        error,
      );
      return false;
    }
  }
}
