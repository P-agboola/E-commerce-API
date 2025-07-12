import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Get app configuration
  const port = configService.get<number>('app.port') || 3000;
  const environment = configService.get<string>('app.env') || 'development';
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api';
  const appName = configService.get<string>('app.name') || 'E-commerce API';
  const appDescription =
    configService.get<string>('app.description') || 'NestJS E-commerce API';
  const appVersion = configService.get<string>('app.version') || '1.0.0';

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: configService.get('app.corsOrigin') || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger API documentation
  if (environment !== 'production') {
    const config = new DocumentBuilder()
      .setTitle(appName)
      .setDescription(
        `${appDescription}
        
## E-commerce RESTful API Documentation

This API provides complete e-commerce functionality including:
- User authentication and management
- Product catalog with categories and variants
- Shopping cart and wishlists
- Order processing
- Payment integration
- Reviews and ratings
- Coupons and discounts
- File uploads

For complete documentation, refer to the documentation.md file.
      `,
      )
      .setVersion(appVersion)
      .setContact(
        'API Support',
        'https://example.com/support',
        'support@example.com',
      )
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .addServer(`http://localhost:${port}`, 'Development Server')
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management endpoints')
      .addTag('products', 'Product catalog endpoints')
      .addTag('cart', 'Shopping cart endpoints')
      .addTag('orders', 'Order processing endpoints')
      .addTag('payments', 'Payment processing endpoints')
      .addTag('payment-analytics', 'Payment analytics endpoints')
      .addTag('reviews', 'Product reviews endpoints')
      .addTag('coupons', 'Discount coupons endpoints')
      .addTag('uploads', 'File upload endpoints')
      .addTag('wishlist', 'Wishlist endpoints')
      .addTag('analytics', 'Analytics and statistics endpoints')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      })
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  }

  await app.listen(port);
  console.log(
    `Application is running on: http://localhost:${port}/${apiPrefix}`,
  );

  if (environment !== 'production') {
    console.log(
      `Swagger documentation is available at: http://localhost:${port}/${apiPrefix}/docs`,
    );
  }
}

bootstrap();
