# Payment Integration Development Guide

This guide provides step-by-step instructions for setting up and testing payment integrations in a local development environment.

## Prerequisites

Before you begin, make sure you have:

- Node.js 18+ installed
- NPM or Yarn installed
- A local PostgreSQL instance running
- A local or remote MongoDB instance
- Redis (optional but recommended for production-like testing)
- API accounts with Stripe and/or PayPal (test/sandbox accounts are sufficient)

## Environment Configuration

1. Copy the `.env.example` file to create your own `.env` file:

   ```bash
   cp .env.example .env
   ```

2. Update the payment-related environment variables:

   ```
   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_API_VERSION=2025-05-28.basil

   # PayPal Configuration
   PAYPAL_CLIENT_ID=...
   PAYPAL_CLIENT_SECRET=...
   PAYPAL_MODE=sandbox # or 'live' for production
   ```

## Setting Up Development Accounts

### Stripe Development Setup

1. Create a Stripe account at [https://stripe.com](https://stripe.com)
2. Navigate to the Developers section and get your API keys
3. Install the Stripe CLI for local webhook testing:

   ```bash
   # For Windows using Scoop
   scoop install stripe-cli

   # For macOS using Homebrew
   brew install stripe/stripe-cli/stripe-cli
   ```

4. Authenticate the CLI:
   ```bash
   stripe login
   ```
5. Forward webhook events to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/webhook/stripe
   ```

### PayPal Development Setup

1. Create a PayPal Developer account at [https://developer.paypal.com](https://developer.paypal.com)
2. Create a sandbox application to get your client ID and secret
3. Create sandbox business and personal accounts for testing
4. For webhook testing, use a service like ngrok to expose your local server:
   ```bash
   ngrok http 3000
   ```
5. Configure your webhook URL in the PayPal Developer Dashboard using the ngrok URL

## Testing Payments

### Stripe Test Cards

Use these test card numbers for simulating different scenarios:

| Card Number         | Scenario                 |
| ------------------- | ------------------------ |
| 4242 4242 4242 4242 | Successful payment       |
| 4000 0000 0000 9995 | Insufficient funds       |
| 4000 0000 0000 3220 | 3D Secure authentication |
| 4000 0000 0000 0002 | Declined payment         |

Use any future expiration date and any three-digit CVC.

### PayPal Sandbox Testing

1. Log in to your PayPal Developer Dashboard
2. Use the sandbox business and personal accounts for testing
3. The sandbox environment simulates the full PayPal experience without real money

## Webhook Testing

### Testing Stripe Webhooks

The Stripe CLI automatically generates test webhook events:

```bash
stripe trigger payment_intent.succeeded
```

Or forward real events from the dashboard to your local server:

```bash
stripe listen --forward-to localhost:3000/api/payments/webhook/stripe
```

### Testing PayPal Webhooks

1. Use ngrok to expose your local server
2. Configure the webhook URL in the PayPal Developer Dashboard
3. Use the PayPal Sandbox IPN Simulator to send test webhook events

## Debugging Tips

### Stripe Debugging

- Enable detailed logging in your code:

  ```typescript
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-05-28.basil',
    appInfo: { name: 'E-commerce API' },
    typescript: true,
    logger: {
      debug: console.log,
      info: console.log,
      error: console.error,
    },
  });
  ```

- Check the Stripe Dashboard Events log for webhook delivery status

### PayPal Debugging

- Enable verbose logging in development:

  ```typescript
  const environment = new paypal.core.SandboxEnvironment(
    clientId,
    clientSecret,
    { logLevel: 'debug' },
  );
  ```

- Use the PayPal Developer Dashboard's logs to verify webhook delivery

## Implementing Front-End Integration

### Stripe Client Integration

1. Use Stripe Elements or Stripe.js
2. Example React integration:

   ```jsx
   import {
     CardElement,
     useStripe,
     useElements,
   } from '@stripe/react-stripe-js';

   const CheckoutForm = () => {
     const stripe = useStripe();
     const elements = useElements();

     const handleSubmit = async (e) => {
       e.preventDefault();

       // Get payment intent client secret from your server
       const { clientSecret } = await fetchPaymentIntentClientSecret();

       // Confirm payment
       const result = await stripe.confirmCardPayment(clientSecret, {
         payment_method: {
           card: elements.getElement(CardElement),
           billing_details: { name: 'Customer Name' },
         },
       });
     };

     return (
       <form onSubmit={handleSubmit}>
         <CardElement />
         <button type="submit">Pay Now</button>
       </form>
     );
   };
   ```

### PayPal Client Integration

1. Use PayPal JavaScript SDK
2. Example integration:

   ```jsx
   import { PayPalButtons } from '@paypal/react-paypal-js';

   const PayPalCheckout = () => {
     return (
       <PayPalButtons
         createOrder={async () => {
           // Call your backend to create an order and return the order ID
           const response = await fetch('/api/payments/paypal/create', {
             method: 'POST',
             body: JSON.stringify({ amount: 100.0 }),
           });
           const order = await response.json();
           return order.id;
         }}
         onApprove={async (data) => {
           // Call your backend to capture the payment
           await fetch('/api/payments/paypal/capture', {
             method: 'POST',
             body: JSON.stringify({ orderID: data.orderID }),
           });
         }}
       />
     );
   };
   ```

## Monitoring and Analytics

After setting up payments, you can use the built-in analytics endpoints:

- `/api/analytics/payments/stats` - Overall payment statistics
- `/api/analytics/payments/methods` - Payment method breakdown
- `/api/analytics/payments/refund-rate` - Refund rate metrics
- `/api/analytics/payments/average-value` - Average transaction value

These endpoints provide useful data for monitoring your payment system during development.

## Troubleshooting Common Issues

### Stripe Issues

- **Webhook Signature Verification Failure**: Ensure you're using the correct webhook secret and raw request body
- **API Version Mismatch**: Use the correct API version in both frontend and backend code
- **Payment Intent Creation Failure**: Verify currency code and amount format (cents for Stripe)

### PayPal Issues

- **SDK Import Errors**: Use dynamic imports as shown in the payment strategy implementation
- **Order Creation Failure**: Ensure correctly formatted amounts and valid currency codes
- **Webhook Verification Issues**: Check PayPal webhook signature verification

## Best Practices

1. **Never log full payment details** - Redact sensitive information
2. **Implement idempotency** - Handle duplicate webhook events safely
3. **Use error boundaries** - Gracefully handle payment failures
4. **Implement proper transaction states** - Track pending, processing, completed, and failed states
5. **Add comprehensive monitoring** - Set up alerts for unusual payment patterns
6. **Test edge cases** - Simulate network issues, timeouts, and partial payments
7. **Document customer-facing error messages** - Ensure clear messaging for payment issues

## Next Steps

After successfully setting up your local development environment:

1. Run comprehensive tests with different payment scenarios
2. Integrate with your frontend application
3. Consider adding more payment methods as needed
4. Implement advanced features like subscriptions or installment payments
