# Payment Module

The payment module provides a robust, extensible system for handling online payments in the e-commerce application. It follows the Strategy pattern to support multiple payment providers with a unified interface.

## Features

- Multiple payment providers (Stripe, PayPal, with easy extension for more)
- Payment lifecycle management (creation, processing, refunds)
- Webhook handling for asynchronous payment events
- Comprehensive error handling and logging
- Analytics integration for payment metrics

## Architecture

```
┌─────────────────┐       ┌─────────────────┐
│ PaymentService  │─────▶ │ PaymentStrategy │
└─────────────────┘       └────────┬────────┘
                                   │
                 ┌─────────────────┼─────────────────┐
                 │                 │                 │
        ┌────────▼─────┐  ┌────────▼─────┐  ┌────────▼─────┐
        │ Stripe       │  │ PayPal       │  │ Other        │
        │ Strategy     │  │ Strategy     │  │ Strategies   │
        └──────────────┘  └──────────────┘  └──────────────┘
```

## Payment Flow

1. **Create Payment**: Initialize a payment intent/order with the payment provider
2. **Process Payment**: Finalize the payment after customer approval
3. **Webhooks**: Handle asynchronous events from payment providers
4. **Refunds**: Process full or partial refunds as needed

## Configuration

Payment providers require proper configuration in your .env file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox  # or 'live' for production
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id
```

## Usage Examples

### Creating a Payment

```typescript
// In your order controller
@Post(':orderId/pay')
async createPayment(
  @Param('orderId') orderId: string,
  @Body() paymentDto: CreatePaymentDto,
) {
  return this.paymentService.create({
    ...paymentDto,
    orderId,
  });
}
```

### Processing a Webhook

```typescript
// In your payment controller
@Post('webhook/stripe')
@HttpCode(200)
processStripeWebhook(
  @Body() payload: any,
  @Headers('stripe-signature') signature: string
) {
  return this.paymentService.processWebhook(
    PaymentProvider.STRIPE,
    payload,
    signature
  );
}
```

## Analytics

The payment module integrates with the analytics module to provide valuable payment metrics:

- Payment success rate
- Payment method breakdown
- Refund rate
- Average transaction value

Access these metrics via the analytics endpoints:

```
GET /api/analytics/payments/stats
GET /api/analytics/payments/methods
GET /api/analytics/payments/refund-rate
GET /api/analytics/payments/average-value
```

## Extending with New Payment Providers

To add a new payment provider:

1. Create a new strategy implementing the `PaymentStrategy` interface
2. Register the strategy in the `PaymentService`
3. Add configuration for the new provider
4. Update the payment controller if needed

See the `payment-integration-guide.md` for more details on implementing new payment providers.
