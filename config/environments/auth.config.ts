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
}));
