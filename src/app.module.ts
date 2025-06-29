import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import appConfig from '../config/environments/app.config';
import databaseConfig from '../config/environments/database.config';
import authConfig from '../config/environments/auth.config';
import emailConfig from '../config/environments/email.config';
import cloudinaryConfig from '../config/environments/cloudinary.config';
import paymentConfig from '../config/environments/payment.config';
import { DatabaseModule } from '../core/database/database.module';
import { AuthModule } from '../modules/auth/auth.module';
import { UserModule } from '../modules/user/user.module';
import { ProductModule } from '../modules/product/product.module';
import { CartModule } from '../modules/cart/cart.module';
import { OrderModule } from '../modules/order/order.module';
import { ReviewModule } from '../modules/review/review.module';
import { CouponModule } from '../modules/coupon/coupon.module';
import { PaymentModule } from '../modules/payment/payment.module';
import { UploadModule } from '../modules/upload/upload.module';
import { AnalyticsModule } from '../modules/analytics/analytics.module';
import { WishlistModule } from '../modules/wishlist/wishlist.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        authConfig,
        emailConfig,
        cloudinaryConfig,
        paymentConfig,
      ],
      envFilePath: ['.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 10,
      },
    ]),

    // Static files (for future admin panel or documentation)
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public',
    }),

    // Database connections
    DatabaseModule,

    // Feature modules
    AuthModule,
    UserModule,
    ProductModule,
    CartModule,
    OrderModule,
    ReviewModule,
    CouponModule,
    PaymentModule,
    UploadModule,
    AnalyticsModule,
    WishlistModule,
  ],
  providers: [
    // Global guards
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
