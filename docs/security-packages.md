# Security Packages and Best Practices

This document provides an in-depth explanation of the security packages used in our e-commerce application, how they're implemented, and best practices for maintaining application security.

## Helmet Package

[Helmet](https://helmetjs.github.io/) is a collection of middleware functions for Express that help secure your application by setting various HTTP headers.

### How Helmet Protects Your Application

Helmet sets the following security headers:

1. **Content-Security-Policy (CSP)**
   - Controls which resources can be loaded by the browser
   - Prevents XSS attacks by specifying which dynamic resources are allowed
   - Example: `default-src 'self'` only allows resources from your own domain

2. **X-XSS-Protection**
   - Enables browser's built-in XSS filters
   - Blocks reflected XSS attacks
   - Modern approach uses CSP instead, but this provides defense in depth

3. **X-Frame-Options**
   - Prevents your site from being embedded in iframes on other sites
   - Protects against clickjacking attacks
   - Values: `DENY`, `SAMEORIGIN`, or specific `ALLOW-FROM uri`

4. **Strict-Transport-Security (HSTS)**
   - Forces browsers to use HTTPS for your site
   - Prevents SSL-stripping attacks and protocol downgrade attempts
   - Example: `max-age=31536000; includeSubDomains; preload`

5. **X-Content-Type-Options**
   - Prevents browsers from MIME-type sniffing
   - Value: `nosniff` prevents browser from trying to guess the content type

6. **X-DNS-Prefetch-Control**
   - Controls DNS prefetching (browser pre-resolving domains)
   - Can prevent certain timing/privacy attacks

7. **Referrer-Policy**
   - Controls what information is included in the Referer header
   - Options range from `no-referrer` to `unsafe-url`

8. **Feature-Policy/Permissions-Policy**
   - Limits which browser features your site can use
   - Controls access to features like camera, microphone, etc.

### Implementation in Our Application

Helmet is applied globally in `main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply helmet with default settings
  app.use(helmet());

  // Or with custom settings
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
          styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
          imgSrc: ["'self'", 'data:', 'res.cloudinary.com'],
          fontSrc: ["'self'", 'fonts.gstatic.com'],
          connectSrc: ["'self'", 'api.stripe.com'],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    }),
  );

  await app.listen(3000);
}
bootstrap();
```

### Best Practices for Helmet

1. **Always enable Helmet in production**
   - It's a non-negotiable security baseline

2. **Customize CSP based on your application needs**
   - Start restrictive and loosen only as required
   - Use CSP reporting to identify needed changes

3. **Test with security headers**
   - Use tools like [Security Headers](https://securityheaders.com/) to analyze your configuration

4. **Understand each header's purpose**
   - Don't disable headers unless you fully understand the security implications

5. **Update regularly**
   - Security best practices evolve; keep Helmet updated

## Rate Limiting with @nestjs/throttler

Rate limiting protects your API from abuse by limiting the number of requests a client can make within a specific time period.

### How Rate Limiting Protects Your Application

1. **Prevents brute force attacks**
   - Limits login attempts to prevent password guessing

2. **Protects against DoS attacks**
   - Prevents attackers from overwhelming your server with requests

3. **Manages API resources**
   - Ensures fair usage and prevents a single client from monopolizing resources

4. **Enforces usage policies**
   - Implements business rules for API consumption

### Types of Rate Limiting Strategies

1. **Fixed Window**
   - Simplest approach: X requests per Y time period
   - Reset counter after window expires

2. **Sliding Window**
   - More granular: Tracks requests over a moving time period
   - Prevents request spikes at window boundaries

3. **Token Bucket**
   - Adds "tokens" at a fixed rate up to a maximum
   - Each request consumes a token

4. **Leaky Bucket**
   - Processes requests at a constant rate
   - Excess requests are queued or rejected

### Implementation in Our Application

#### Basic Implementation with @nestjs/throttler

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60, // Time window in seconds
      limit: 20, // Number of requests allowed in the window
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Apply globally
    },
  ],
})
export class AppModule {}
```

#### Advanced Implementation with Different Limits per Route

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60,
          limit: 20,
        },
        {
          name: 'auth',
          ttl: 60,
          limit: 5, // More restrictive for auth routes
        },
        {
          name: 'webhook',
          ttl: 60,
          limit: 100, // More permissive for webhooks
        },
      ],
    }),
  ],
})
export class AppModule {}

// auth.controller.ts
import { Controller, UseGuards } from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

@Controller('auth')
@UseGuards(ThrottlerGuard)
@Throttle({ auth: true }) // Use the 'auth' throttler configuration
export class AuthController {
  // Routes with stricter rate limiting
}
```

#### Integration with Redis for Distributed Systems

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { RedisOptions } from 'ioredis';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 20,
      storage: new ThrottlerStorageRedisService({
        host: 'localhost',
        port: 6379,
        keyPrefix: 'throttle:',
      } as RedisOptions),
    }),
  ],
})
export class AppModule {}
```

#### Custom Rate Limiter with rate-limiter-flexible

For more advanced scenarios, we use `rate-limiter-flexible`:

```typescript
// services/advanced-rate-limiter.service.ts
import { Injectable } from '@nestjs/common';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdvancedRateLimiterService {
  private readonly loginLimiter: RateLimiterRedis;
  private readonly apiLimiter: RateLimiterRedis;

  constructor(private configService: ConfigService) {
    const redisClient = new Redis(this.configService.get('REDIS_URL'));

    // Strict limiter for login attempts
    this.loginLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:login',
      points: 5, // 5 attempts
      duration: 60 * 30, // per 30 minutes
      blockDuration: 60 * 60, // Block for 1 hour on too many attempts
      insuranceLimiter: {
        points: 2, // Allow 2 more attempts if Redis is down
        duration: 60, // in 1 minute
      },
    });

    // General API limiter
    this.apiLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:api',
      points: 50, // 50 requests
      duration: 60, // per 1 minute
    });
  }

  async checkLoginLimit(ip: string): Promise<boolean> {
    try {
      await this.loginLimiter.consume(ip);
      return true; // Not blocked
    } catch (error) {
      return false; // Limit exceeded
    }
  }

  async checkApiLimit(ip: string, userId?: string): Promise<boolean> {
    const key = userId ? `${ip}_${userId}` : ip;
    try {
      await this.apiLimiter.consume(key);
      return true; // Not blocked
    } catch (error) {
      return false; // Limit exceeded
    }
  }
}
```

### Best Practices for Rate Limiting

1. **Identify sensitive endpoints**
   - Apply stricter limits to authentication, payment, and user management endpoints

2. **Use appropriate time windows**
   - Short windows (seconds/minutes) for most API calls
   - Longer windows (hours/days) for sensitive operations

3. **Consider different client identifiers**
   - IP address (basic, but can be problematic with shared IPs)
   - API keys (better for authenticated APIs)
   - User IDs (best for per-user quotas)
   - Combinations of the above

4. **Implement proper response headers**
   - `X-RateLimit-Limit`: Maximum allowed requests
   - `X-RateLimit-Remaining`: Remaining requests in period
   - `X-RateLimit-Reset`: Time when limit resets

5. **Graceful degradation**
   - Return 429 (Too Many Requests) status code
   - Include a helpful message and Retry-After header

6. **Use distributed storage**
   - Redis or a similar solution for multi-instance deployments

7. **Monitor and adjust**
   - Track rate limit hits and adjust based on patterns

## Additional Security Packages

In addition to Helmet and Rate Limiting, our application uses these security-related packages:

### bcrypt

- **Purpose**: Secure password hashing
- **Implementation**:

  ```typescript
  // user.service.ts
  import * as bcrypt from 'bcrypt';

  @Injectable()
  export class UserService {
    async hashPassword(password: string): Promise<string> {
      const salt = await bcrypt.genSalt(12); // Higher rounds = more secure but slower
      return bcrypt.hash(password, salt);
    }

    async validatePassword(
      plainText: string,
      hashedPassword: string,
    ): Promise<boolean> {
      return bcrypt.compare(plainText, hashedPassword);
    }
  }
  ```

### JWT (JSON Web Tokens)

- **Purpose**: Secure, stateless authentication
- **Implementation**:

  ```typescript
  // auth.module.ts
  import { JwtModule } from '@nestjs/jwt';

  @Module({
    imports: [
      JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          secret: config.get('JWT_SECRET'),
          signOptions: {
            expiresIn: '15m', // Short-lived access token
          },
        }),
      }),
    ],
  })
  export class AuthModule {}
  ```

### cookie-parser

- **Purpose**: Secure cookie management
- **Implementation**:

  ```typescript
  // main.ts
  import * as cookieParser from 'cookie-parser';

  async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use(cookieParser(process.env.COOKIE_SECRET));
    // Other setup...
  }
  ```

## Security Measures Beyond Packages

Our application implements additional security measures:

1. **CORS Configuration**

   ```typescript
   // main.ts
   app.enableCors({
     origin: configService.get('ALLOWED_ORIGINS').split(','),
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
     credentials: true,
     maxAge: 3600,
   });
   ```

2. **Request Validation** with class-validator

   ```typescript
   // main.ts
   app.useGlobalPipes(
     new ValidationPipe({
       whitelist: true, // Strip unknown properties
       forbidNonWhitelisted: true, // Reject requests with unknown properties
       transform: true, // Transform payloads to DTOs
     }),
   );
   ```

3. **Global Exception Filter** for security-oriented error handling
   ```typescript
   // filters/http-exception.filter.ts
   @Catch(HttpException)
   export class HttpExceptionFilter implements ExceptionFilter {
     catch(exception: HttpException, host: ArgumentsHost) {
       const ctx = host.switchToHttp();
       const response = ctx.getResponse<Response>();
       const status = exception.getStatus();
       const exceptionResponse = exception.getResponse();

       // Sanitize error messages in production
       const message =
         process.env.NODE_ENV === 'production'
           ? this.sanitizeErrorMessage(exceptionResponse)
           : exceptionResponse;

       response.status(status).json({
         statusCode: status,
         message,
         timestamp: new Date().toISOString(),
       });
     }

     private sanitizeErrorMessage(error: any): string | object {
       // Remove sensitive information from error messages
       // Return user-friendly error
     }
   }
   ```

## Security Best Practices Summary

1. **Keep dependencies updated**
   - Regularly update all packages to patch security vulnerabilities
   - Use tools like npm audit or Snyk to identify vulnerable dependencies

2. **Implement proper authentication and authorization**
   - Use JWT with short expiration times
   - Implement role-based access control
   - Use refresh tokens with rotation

3. **Secure data transmission**
   - Always use HTTPS
   - Implement proper CORS policies
   - Use secure cookies

4. **Input validation and sanitization**
   - Validate all inputs with class-validator
   - Sanitize inputs to prevent injection attacks
   - Implement request size limits

5. **Database security**
   - Use parameterized queries
   - Implement least privilege access
   - Never expose error details

6. **Logging and monitoring**
   - Log security events
   - Monitor for suspicious activity
   - Implement alerts for security anomalies

7. **Regular security testing**
   - Perform penetration testing
   - Use automated vulnerability scanning
   - Conduct code reviews focused on security

## Conclusion

The security of our e-commerce application is built on multiple layers of protection. By implementing packages like Helmet and rate limiting, along with following security best practices, we create a defense-in-depth strategy that protects both our users' data and our system resources.

Regular security audits and staying current with the latest security recommendations are essential parts of maintaining our application's security posture.
