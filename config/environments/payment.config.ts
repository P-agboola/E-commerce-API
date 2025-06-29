import { registerAs } from '@nestjs/config';

export default registerAs('payment', () => ({
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? 'stripe_secret_key',
    publicKey: process.env.STRIPE_PUBLIC_KEY ?? 'stripe_public_key',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? 'stripe_webhook_secret',
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID ?? 'paypal_client_id',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET ?? 'paypal_client_secret',
    mode: process.env.PAYPAL_MODE ?? 'sandbox', // sandbox or live
  },
}));
