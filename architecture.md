# E-commerce Backend Architecture

This document presents the architectural design of the E-commerce backend system.

## System Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────────┐
│                           E-Commerce Backend API                          │
└───────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                               API Gateway                                 │
│    ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐    │
│    │ Helmet  │  │  CORS   │  │  Rate   │  │  Auth   │  │ Validation  │    │
│    │         │  │         │  │ Limiter │  │ Guards  │  │   Pipes     │    │
│    └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────────┘    │
└───────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                             Feature Modules                               │
├───────────┬───────────┬───────────┬───────────┬───────────┬───────────────┤
│           │           │           │           │           │               │
│   Auth    │   User    │  Product  │   Cart    │   Order   │    Review     │
│           │           │           │           │           │               │
├───────────┼───────────┼───────────┼───────────┼───────────┼───────────────┤
│           │           │           │           │           │               │
│  Coupon   │  Payment  │  Upload   │  Wishlist │ Analytics │               │
│           │           │           │           │           │               │
└───────────┴───────────┴───────────┴───────────┴───────────┴───────────────┘
                                     │
                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                           Core Infrastructure                             │
├───────────────────┬───────────────────────────────┬───────────────────────┤
│                   │                               │                       │
│  Database Module  │  Configuration/Environment    │     Guards/Auth       │
│                   │                               │                       │
└───────────────────┴───────────────────────────────┴───────────────────────┘
                                     │
                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                            Data Storage                                   │
├───────────────────┬───────────────────────────────┬───────────────────────┤
│                   │                               │                       │
│    PostgreSQL     │           MongoDB             │       Redis           │
│  (Structured Data)│     (Unstructured Data)       │ (Caching/Sessions)    │
│                   │                               │                       │
└───────────────────┴───────────────────────────────┴───────────────────────┘
```

## Module Interactions

```
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│      AuthModule   │◄────┤     UserModule    │◄────┤   ProductModule   │
└───────┬───────────┘     └───────┬───────────┘     └───────┬───────────┘
        │                         │                         │
        │                         │                         │
┌───────▼───────────┐     ┌───────▼───────────┐     ┌───────▼───────────┐
│     OrderModule   │◄────┤     CartModule    │◄────┤   WishlistModule  │
└───────┬───────────┘     └───────────────────┘     └───────────────────┘
        │
        │
┌───────▼───────────┐     ┌───────────────────┐     ┌───────────────────┐
│   PaymentModule   │     │    ReviewModule    │     │    UploadModule   │
└───────────────────┘     └───────────────────┘     └───────────────────┘
```

## Data Flow

1. **Client Request** → API Gateway (Security & Validation)
2. **API Gateway** → Feature Module Controller
3. **Controller** → Service (Business Logic)
4. **Service** → Repository/Model (Data Access)
5. **Repository/Model** → Database (Data Storage)
6. **Database** → Repository/Model (Data Retrieval)
7. **Repository/Model** → Service (Data Processing)
8. **Service** → Controller (Response Preparation)
9. **Controller** → Client (HTTP Response)

## Authentication Flow

```
┌──────────┐     ┌───────────────┐     ┌───────────────┐     ┌─────────────┐
│  Client  │────►│ Auth Controller│────►│  Auth Service │────►│ User Service│
└────┬─────┘     └───────┬───────┘     └───────┬───────┘     └──────┬──────┘
     │                   │                     │                    │
     │                   │                     │                    │
     │                   │                     │                   ▼
     │                   │                     │            ┌─────────────┐
     │                   │                     │            │   Database  │
     │                   │                     │            └──────┬──────┘
     │                   │                    ▼                    │
     │                   │           ┌───────────────┐             │
     │                   │           │   JWT Token   │◄────────────┘
     │                  ▼            └───────┬───────┘
     │           ┌───────────────┐           │
     │◄──────────┤ Access Token  │◄──────────┘
     │           └───────────────┘
     │
     │
     │           ┌───────────────────────────┐
     └──────────►│ Protected API Endpoints   │
                 └───────────────────────────┘
```

## Database Schema Overview

### PostgreSQL (TypeORM)

- **User**: User accounts and profiles
- **Product**: Product catalog with variants
- **Category**: Product categories
- **Order**: Customer orders
- **OrderItem**: Order line items
- **Review**: Product reviews
- **Coupon**: Discount coupons
- **UploadedFile**: File metadata

### MongoDB (Mongoose)

- **Cart**: Shopping cart data
- **Wishlist**: User wishlists
- **ActivityLog**: User activity tracking

### Redis

- **Sessions**: User sessions
- **Caching**: API response caching
- **RateLimiting**: API rate limiting data

## Directory Structure

```
E-commerce/
├── src/
│   ├── app.module.ts       # Main application module
│   └── main.ts             # Application entry point
├── common/                 # Shared enums and interfaces
├── config/                 # Configuration modules
├── core/                   # Core database modules
├── lib/                    # Shared utilities, decorators, etc.
├── modules/                # Feature modules
│   ├── auth/               # Authentication module
│   ├── user/               # User management module
│   ├── product/            # Product catalog module
│   └── ...                 # Other feature modules
├── migrations/             # Database migrations
├── test/                   # End-to-end tests
└── uploads/                # Local file storage
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for secure password storage
- **RBAC**: Role-based access control
- **API Rate Limiting**: Protection against abuse
- **Helmet**: HTTP header security
- **CORS**: Cross-origin resource sharing protection
- **Validation**: Input validation and sanitization
- **SSL/TLS**: Encrypted data transmission (in production)

## Scalability Considerations

- **Database Scaling**:
  - PostgreSQL: Master-slave replication for read scaling
  - MongoDB: Sharding for horizontal scaling
  - Redis: Clustering for distributed caching

- **Application Scaling**:
  - Stateless design for horizontal scaling
  - Load balancing across multiple instances
  - Containerization with Docker and Kubernetes

- **Performance Optimization**:
  - Response caching
  - Database indexing
  - Query optimization
  - Background job processing
