import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwt: {
    secret: process.env.JWT_SECRET ?? 'super-secret-change-in-production',
    expiresIn: parseInt(process.env.JWT_EXPIRATION ?? '3600', 10),
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ??
      'refresh-super-secret-change-in-production',
    refreshExpiresIn: parseInt(
      process.env.JWT_REFRESH_EXPIRATION ?? '604800',
      10,
    ),
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ??
      'http://localhost:3000/auth/google/callback',
  },
  twoFactor: {
    appName: process.env.TWO_FACTOR_APP_NAME ?? 'E-commerce API',
    issuer: process.env.TWO_FACTOR_ISSUER ?? 'E-commerce',
  },
}));
