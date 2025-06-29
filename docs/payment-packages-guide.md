# Payment Processing Packages

This document provides a detailed overview of the payment processing packages used in our e-commerce backend, explaining their features, integration points, and best practices.

## Stripe

**Package**: `stripe` (v18.2.1)

### Overview

Stripe is a comprehensive payment processing platform that handles credit/debit card payments, alternative payment methods, subscriptions, and more. Our implementation uses Stripe's Payment Intents API for modern, SCA-compliant transactions.

### Key Features

- **Payment Intents**: Handles the complete payment flow, including Strong Customer Authentication (SCA) requirements.
- **Webhooks**: Asynchronous event notifications for payment state changes.
- **Refunds**: Full and partial refund capabilities.
- **Error Handling**: Comprehensive error objects with detailed information.

### Implementation Details

- Uses Strategy Pattern via `StripePaymentStrategy` class
- API Version: '2025-05-28.basil' (latest stable at time of implementation)
- Handles both server-side and client-side integration

### Best Practices

- Store API keys in environment variables, never in code
- Always verify webhook signatures using `webhookSecret`
- Convert currency values to cents when sending to Stripe (multiply by 100)
- Convert currency values back to decimal when receiving from Stripe (divide by 100)
- Implement proper error handling with specific error messages

### Example Usage

```typescript
// Creating a payment intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(amount * 100), // Convert to cents
  currency: 'usd',
  metadata: { orderId: '12345' },
  description: 'Order #12345',
  receipt_email: customer.email, // Optional
});

// Processing a webhook
const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

// Handling specific webhook events
switch (event.type) {
  case 'payment_intent.succeeded':
    await this.handleSuccessfulPayment(event.data.object);
    break;
  case 'payment_intent.payment_failed':
    await this.handleFailedPayment(event.data.object);
    break;
  case 'charge.refunded':
    await this.handleRefund(event.data.object);
    break;
}

// Issuing a refund
const refund = await stripe.refunds.create({
  payment_intent: paymentIntentId,
  amount: Math.round(amount * 100), // For partial refunds
  reason: 'requested_by_customer', // Optional: 'duplicate', 'fraudulent', 'requested_by_customer'
});
```

## PayPal

**Package**: `@paypal/paypal-server-sdk` (v1.1.0)

### Overview

PayPal SDK enables integration with PayPal's payment services, including express checkout, standard payments, and refund capabilities. Our implementation uses the Orders API for modern checkout experiences.

### Key Features

- **Orders API**: Create and capture payment orders
- **Dynamic SDK Loading**: Implemented to avoid import issues
- **Environment Flexibility**: Works with both sandbox and live environments
- **Webhook Support**: Processes IPN (Instant Payment Notifications)

### Implementation Details

- Uses Strategy Pattern via `PaypalPaymentStrategy` class
- Supports both sandbox and production environments
- Dynamically imports the SDK to prevent TypeScript issues
- Handles order creation, capture, and refund operations

### Best Practices

- Store credentials in environment variables
- Use `custom_id` field to link PayPal orders with your application's orders
- Always verify webhook authenticity
- Implement proper error logging
- Handle edge cases like pending or partially approved payments

### Example Usage

```typescript
// Dynamically import the PayPal SDK to avoid TypeScript issues
const paypal = await import('@paypal/paypal-server-sdk');

// Create a PayPal client
const environment =
  mode === 'live'
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret);

const client = new paypal.core.PayPalHttpClient(environment);

// Create an order
const request = new paypal.orders.OrdersCreateRequest();
request.prefer('return=representation');
request.requestBody({
  intent: 'CAPTURE',
  purchase_units: [
    {
      amount: {
        currency_code: 'USD',
        value: amount.toFixed(2),
      },
      description: 'Order payment',
      custom_id: orderId,
      reference_id: orderId,
    },
  ],
  application_context: {
    brand_name: 'Your E-commerce Store',
    return_url: 'https://yourdomain.com/checkout/success',
    cancel_url: 'https://yourdomain.com/checkout/cancel',
  },
});

// Execute the request and capture the order ID
const response = await client.execute(request);
const orderId = response.result.id;

const response = await client.execute(request);
```

## Integration Architecture

Our payment system follows the Strategy design pattern to support multiple payment providers while maintaining a consistent interface:

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

### Common Interface

All payment strategies implement the `PaymentStrategy` interface with these methods:

- `createPayment`: Initializes a payment transaction
- `processPayment`: Finalizes a payment
- `refundPayment`: Issues a refund
- `verifyWebhook`: Validates webhook authenticity

## Testing Payment Integrations

### Stripe Testing

- Use Stripe's test card numbers (e.g., 4242 4242 4242 4242 for success)
- Test webhook endpoints with Stripe CLI: `stripe listen --forward-to localhost:3000/api/payments/webhook/stripe`
- Test 3D Secure flows with card 4000 0000 0000 3220

### PayPal Testing

- Use PayPal sandbox accounts for both merchant and customer
- Test IPN with the PayPal IPN Simulator in the Developer Dashboard
- Verify webhook endpoints with ngrok for local testing

## Security Considerations

- **PCI Compliance**: Our implementation avoids storing card details directly
- **API Key Rotation**: Implement regular rotation of API keys
- **Webhook Verification**: Always verify the authenticity of webhook events
- **Error Handling**: Implement proper error handling without exposing sensitive information
- **Logging**: Log payment events for audit purposes, but avoid logging sensitive data

## Analytics Integration

Payment data feeds into our analytics system to provide:

- Payment success rates
- Method breakdown by provider
- Refund rates
- Average transaction values
- Payment trends over time

This data is accessible through the `/api/analytics/payments/*` endpoints and requires admin privileges. Specific endpoints include:

```
GET /api/analytics/payments/stats
GET /api/analytics/payments/methods
GET /api/analytics/payments/refund-rate
GET /api/analytics/payments/average-value
```

The analytics system leverages aggregation queries to process payment data from both successful and failed transactions, providing actionable insights through the dedicated `PaymentAnalyticsService`.

## Extending with New Payment Providers

To add a new payment provider:

1. Create a new strategy class implementing `PaymentStrategy`
2. Add the provider to the `PaymentProvider` enum
3. Register the strategy in the `PaymentService`
4. Configure environment variables
5. Update frontend integration as needed

## Conclusion

Our payment processing system provides a robust, flexible foundation for handling online payments. By leveraging established SDKs and following best practices, we've created a secure, maintainable implementation that can be easily extended to support additional payment methods in the future.
