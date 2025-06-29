import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  host: process.env.MAIL_HOST ?? 'smtp.example.com',
  port: parseInt(process.env.MAIL_PORT ?? '587', 10),
  user: process.env.MAIL_USER ?? 'user@example.com',
  password: process.env.MAIL_PASSWORD ?? 'password',
  from: process.env.MAIL_FROM ?? 'no-reply@ecommerce.com',
}));
