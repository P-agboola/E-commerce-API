# Payment Error Handling Guide

## Introduction

Proper error handling is critical for a payment system. This guide outlines best practices for handling errors in our e-commerce payment processing flow, ensuring a robust, user-friendly, and secure payment experience.

## Types of Payment Errors

### 1. Validation Errors

- Missing or invalid payment information
- Incorrect credit card details
- Invalid billing address

### 2. Processing Errors

- Insufficient funds
- Declined by issuing bank
- Card expired or invalid
- Payment provider service disruption

### 3. Authentication Errors

- 3D Secure authentication failed
- Failed security checks
- Suspicious transaction flags

### 4. Technical Errors

- Network connectivity issues
- Timeout errors
- API version mismatches
- Serialization/deserialization errors

### 5. Business Logic Errors

- Currency mismatches
- Amount calculation errors
- Duplicate payment attempts
- Order state inconsistencies

## Error Handling Principles

Our payment error handling follows these core principles:

### 1. User-Friendly Messaging

Always provide clear, actionable error messages to users without exposing technical details:

```typescript
// Bad
throw new Error('SQL error: Connection timed out while processing payment');

// Good
throw new PaymentProcessingException(
  "We couldn't process your payment at this time. Please try again in a few minutes.",
  'DATABASE_CONNECTION_ERROR',
);
```

### 2. Detailed Logging

Log comprehensive error information for debugging while keeping sensitive data secure:

```typescript
try {
  await this.processStripePayment(paymentData);
} catch (error) {
  // Redact sensitive information
  const sanitizedData = this.redactSensitiveInfo(paymentData);

  this.logger.error(
    `Payment processing failed for order ${paymentData.orderId}`,
    {
      error: error.message,
      code: error.code,
      paymentMethod: sanitizedData.method,
      timestamp: new Date().toISOString(),
    },
  );

  throw new PaymentProcessingException(
    this.getClientErrorMessage(error.code),
    error.code,
  );
}
```

### 3. Graceful Degradation

Implement fallbacks when possible:

```typescript
async processPayment(paymentData: CreatePaymentDto): Promise<PaymentEntity> {
  try {
    // Try primary payment processor
    return await this.primaryStrategy.processPayment(paymentData);
  } catch (error) {
    if (this.isFailoverEligible(error) && this.config.enableFailover) {
      this.logger.warn('Primary payment processor failed, trying fallback');
      return await this.fallbackStrategy.processPayment(paymentData);
    }
    throw error;
  }
}
```

### 4. Idempotency

Ensure payment operations are idempotent to prevent duplicate charges:

```typescript
async createPayment(paymentData: CreatePaymentDto): Promise<PaymentEntity> {
  // Check for existing payment with the same idempotency key
  const existingPayment = await this.paymentRepository.findOne({
    where: { idempotencyKey: paymentData.idempotencyKey }
  });

  if (existingPayment) {
    this.logger.info(`Returning existing payment for idempotency key ${paymentData.idempotencyKey}`);
    return existingPayment;
  }

  // Process new payment...
}
```

## Payment Provider-Specific Error Handling

### Stripe Error Handling

Stripe provides structured error objects that should be handled appropriately:

```typescript
try {
  const paymentIntent = await this.stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    // Other parameters...
  });
  return paymentIntent;
} catch (error) {
  if (error.type === 'StripeCardError') {
    // Card was declined
    throw new PaymentDeclinedException(error.message, error.code);
  } else if (error.type === 'StripeInvalidRequestError') {
    // Invalid parameters were supplied
    this.logger.error('Invalid Stripe request', error);
    throw new InvalidPaymentDataException(
      'The payment information was invalid',
    );
  } else if (error.type === 'StripeAPIError') {
    // API errors suggest a problem with Stripe's servers
    this.logger.error('Stripe API error', error);
    throw new PaymentProviderException(
      'Payment service temporarily unavailable',
    );
  } else {
    // Handle other types of errors
    this.logger.error('Unexpected Stripe error', error);
    throw new PaymentProcessingException('An unexpected error occurred');
  }
}
```

### PayPal Error Handling

PayPal errors require different handling:

```typescript
try {
  const paypal = await import('@paypal/paypal-server-sdk');
  // PayPal payment processing...
  return response;
} catch (error) {
  // PayPal provides error details in a nested structure
  const details = error.details ? error.details : [];

  if (details.some((detail) => detail.issue === 'INSTRUMENT_DECLINED')) {
    throw new PaymentDeclinedException(
      'Payment method was declined',
      'PAYPAL_DECLINED',
    );
  } else if (error.message.includes('VALIDATION_ERROR')) {
    this.logger.error('PayPal validation error', error);
    throw new InvalidPaymentDataException(
      'The payment information was invalid',
    );
  } else {
    this.logger.error('PayPal error', error);
    throw new PaymentProviderException('Payment service error');
  }
}
```

## Exception Hierarchy

Our payment module implements a structured exception hierarchy:

```typescript
// Base payment exception
export class PaymentException extends HttpException {
  constructor(
    message: string,
    errorCode: string,
    statusCode: number = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        message,
        errorCode,
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
  }
}

// Specific exception types
export class PaymentDeclinedException extends PaymentException {
  constructor(message: string, errorCode: string) {
    super(message, errorCode, HttpStatus.PAYMENT_REQUIRED);
  }
}

export class InvalidPaymentDataException extends PaymentException {
  constructor(message: string) {
    super(message, 'INVALID_PAYMENT_DATA', HttpStatus.BAD_REQUEST);
  }
}

export class PaymentProviderException extends PaymentException {
  constructor(message: string) {
    super(message, 'PAYMENT_PROVIDER_ERROR', HttpStatus.SERVICE_UNAVAILABLE);
  }
}

export class PaymentProcessingException extends PaymentException {
  constructor(message: string, errorCode: string) {
    super(message, errorCode, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
```

## Webhook Error Handling

Webhook processing requires special error handling:

```typescript
async processWebhook(payload: Buffer, signature: string, provider: string): Promise<void> {
  try {
    let event;

    if (provider === PaymentProvider.STRIPE) {
      event = this.stripeStrategy.verifyWebhook(payload, signature);
    } else if (provider === PaymentProvider.PAYPAL) {
      event = this.paypalStrategy.verifyWebhook(payload, signature);
    } else {
      throw new BadRequestException(`Unsupported payment provider: ${provider}`);
    }

    await this.handlePaymentEvent(event, provider);

  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error; // Pass validation errors through
    }

    this.logger.error(`Webhook processing failed for ${provider}`, error);

    // For webhooks, we should return 200 even on internal errors
    // to prevent the payment provider from retrying repeatedly
    // Instead, we log the error and trigger an alert for manual investigation
    this.alertService.triggerAlert({
      type: 'WEBHOOK_PROCESSING_FAILURE',
      provider,
      timestamp: new Date(),
      error: error.message
    });
  }
}
```

## Error Recovery Strategies

### 1. Automatic Retries

Implement intelligent retry logic for transient errors:

```typescript
@Injectable()
export class PaymentRetryService {
  constructor(private readonly paymentService: PaymentService) {}

  async processWithRetry(
    paymentData: CreatePaymentDto,
    maxAttempts = 3,
    baseDelayMs = 1000,
  ): Promise<PaymentEntity> {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.paymentService.createPayment(paymentData);
      } catch (error) {
        lastError = error;

        // Only retry on specific error types that might be transient
        if (!this.isRetryableError(error)) {
          throw error;
        }

        if (attempt < maxAttempts) {
          // Exponential backoff with jitter
          const delay =
            baseDelayMs *
            Math.pow(2, attempt - 1) *
            (0.8 + Math.random() * 0.4);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  private isRetryableError(error: any): boolean {
    // Identify errors that might be resolved by retrying
    return (
      error instanceof PaymentProviderException ||
      (error.code &&
        ['network_error', 'timeout', 'service_unavailable'].includes(
          error.code,
        ))
    );
  }
}
```

### 2. Payment Status Reconciliation

Implement a reconciliation process for detecting and resolving payment inconsistencies:

```typescript
@Injectable()
export class PaymentReconciliationService {
  @Cron('0 */4 * * *') // Run every 4 hours
  async reconcileIncompletePayments() {
    // Find payments that have been in 'processing' state for too long
    const stuckPayments = await this.paymentRepository.find({
      where: {
        status: PaymentStatus.PROCESSING,
        updatedAt: LessThan(new Date(Date.now() - 30 * 60 * 1000)), // 30 minutes ago
      },
    });

    for (const payment of stuckPayments) {
      try {
        await this.checkPaymentStatusWithProvider(payment);
      } catch (error) {
        this.logger.error(`Failed to reconcile payment ${payment.id}`, error);
      }
    }
  }

  private async checkPaymentStatusWithProvider(
    payment: PaymentEntity,
  ): Promise<void> {
    // Fetch current status from payment provider
    const strategy = this.strategyFactory.getStrategy(payment.provider);
    const providerStatus = await strategy.checkPaymentStatus(
      payment.providerPaymentId,
    );

    if (
      providerStatus.isCompleted &&
      payment.status !== PaymentStatus.COMPLETED
    ) {
      await this.paymentService.updatePaymentStatus(
        payment.id,
        PaymentStatus.COMPLETED,
        'Reconciled from provider status check',
      );
    } else if (
      providerStatus.isFailed &&
      payment.status !== PaymentStatus.FAILED
    ) {
      await this.paymentService.updatePaymentStatus(
        payment.id,
        PaymentStatus.FAILED,
        `Reconciled from provider: ${providerStatus.failureReason || 'Unknown reason'}`,
      );
    }
  }
}
```

## Client Error Response Format

All payment errors returned to clients follow a consistent format:

```json
{
  "status": "error",
  "message": "Your card was declined. Please try another payment method.",
  "errorCode": "CARD_DECLINED",
  "timestamp": "2023-09-01T12:34:56.789Z",
  "details": {
    "paymentId": "pay_123456",
    "suggestion": "Please verify your card details or try another payment method"
  }
}
```

## Monitoring and Alerting

Set up appropriate monitoring for payment errors:

```typescript
@Injectable()
export class PaymentMonitoringService {
  private errorCounts: Map<string, number> = new Map();
  private readonly ERROR_THRESHOLD = 5;
  private readonly TIME_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  constructor(
    private readonly logger: LoggerService,
    private readonly alertService: AlertService,
  ) {
    // Reset error counts periodically
    setInterval(() => this.errorCounts.clear(), this.TIME_WINDOW_MS);
  }

  trackError(errorCode: string, paymentData: any): void {
    // Increment error count
    const currentCount = (this.errorCounts.get(errorCode) || 0) + 1;
    this.errorCounts.set(errorCode, currentCount);

    // Log all errors
    this.logger.error(`Payment error: ${errorCode}`, {
      provider: paymentData.provider,
      method: paymentData.method,
      errorCount: currentCount,
    });

    // Alert if error count exceeds threshold
    if (currentCount >= this.ERROR_THRESHOLD) {
      this.alertService.triggerAlert({
        type: 'PAYMENT_ERROR_THRESHOLD_EXCEEDED',
        errorCode,
        count: currentCount,
        timeWindow: '15 minutes',
      });
    }
  }
}
```

## Testing Error Scenarios

Implement comprehensive tests for error conditions:

```typescript
describe('PaymentService - Error Handling', () => {
  it('should handle card declined errors properly', async () => {
    // Arrange
    const paymentData = {
      // Use test card number known to trigger 'card declined'
      cardNumber: '4000000000000002',
      // Other payment data...
    };

    // Act & Assert
    await expect(paymentService.createPayment(paymentData)).rejects.toThrow(
      PaymentDeclinedException,
    );
  });

  it('should retry on network errors', async () => {
    // Arrange
    jest
      .spyOn(stripeService, 'createPaymentIntent')
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ id: 'pi_123', status: 'succeeded' });

    // Act
    const result = await paymentRetryService.processWithRetry(validPaymentData);

    // Assert
    expect(result).toBeDefined();
    expect(stripeService.createPaymentIntent).toHaveBeenCalledTimes(2);
  });
});
```

## Conclusion

Effective error handling in payment processing requires:

1. Comprehensive error categorization and handling
2. Clear user feedback without revealing sensitive details
3. Detailed logging for debugging
4. Graceful degradation and fallbacks
5. Idempotent operations to prevent duplicate charges
6. Automatic retry and reconciliation mechanisms
7. Robust monitoring and alerting

By following these practices, we ensure a reliable payment system that can handle errors gracefully while maintaining a good user experience and system integrity.
