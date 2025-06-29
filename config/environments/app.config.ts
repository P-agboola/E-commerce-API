import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  name: process.env.APP_NAME ?? 'E-commerce API',
  description: process.env.APP_DESCRIPTION ?? 'E-commerce API with NestJS',
  version: process.env.APP_VERSION ?? '1.0.0',
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  apiUrl: process.env.API_URL ?? 'http://localhost:3000',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:3001',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL ?? '60', 10),
    limit: parseInt(process.env.RATE_LIMIT_LIMIT ?? '10', 10),
  },
}));
