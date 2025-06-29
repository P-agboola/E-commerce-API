# E-commerce Backend API

A complete, modular, production-ready e-commerce backend API built with NestJS, TypeScript, PostgreSQL, MongoDB, and Redis.

## Features

- **Authentication & Authorization**: JWT, RBAC, bcrypt, refresh tokens
- **User Management**: Registration, authentication, profiles, address book
- **Product Management**: Catalog, categories, variants, search, filtering
- **Shopping Experience**: Cart (MongoDB), wishlist, favorites
- **Order Management**: Checkout, history, tracking, statuses
- **Payment Integration**: Multiple payment gateways
- **Reviews & Ratings**: Customer feedback with moderation
- **Discounts & Promotions**: Coupon system, seasonal offers
- **File Uploads**: Product images with Cloudinary integration
- **Analytics**: Sales, inventory, user behavior
- **Admin Operations**: User management, product approval, order processing

## Architecture

This project follows clean architecture principles:

- **Core**: Database connections, shared utilities
- **Modules**: Feature-specific modules (auth, users, products, etc.)
- **Common**: Shared DTOs, interfaces, constants
- **Lib**: Base entities, decorators, guards
- **Config**: Environment configuration

## Tech Stack

- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.x
- **Databases**:
  - PostgreSQL (TypeORM): Relational data (users, products, orders)
  - MongoDB (Mongoose): Unstructured data (cart, wishlist)
  - Redis: Caching, sessions
- **Authentication**: JWT with refresh tokens
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator, class-transformer
- **Security**: helmet, rate limiting, CORS protection
- **File Storage**: Local + Cloudinary
- **Testing**: Jest

## Prerequisites

- Node.js (v18+)
- PostgreSQL
- MongoDB
- Redis
- npm or yarn

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/e-commerce-backend.git
   cd e-commerce-backend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:

   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file with your own configuration.

4. **Database setup**:

   ```bash
   # Run migrations
   npm run migration:run
   ```

5. **Start the application**:

   ```bash
   # Development
   npm run start:dev

   # Production
   npm run build
   npm run start:prod
   ```

## Documentation

Once the application is running, you can access the Swagger documentation at:

```
http://localhost:3000/api/docs
```

For comprehensive project documentation, we provide the following resources:

- [Documentation](./documentation.md) - Complete project documentation
- [API Endpoint Reference](./api-endpoint-reference.md) - Detailed API endpoint documentation with request/response examples
- [Architecture Documentation](./architecture.md) - System design and architecture diagrams
- [Developer Guide](./developer-guide.md) - Getting started guide for developers
- [Payment Integration Guide](./payment-integration-guide.md) - Detailed guide for payment gateway integration
- [Database Schema](./database-schema.md) - Database structure and relationships

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Database Schema

For a comprehensive overview of the database schema, including tables, relationships, and sample structures, see our [Database Schema Documentation](./database-schema.md).

### PostgreSQL Tables

- users
- products
- orders
- order_items
- coupons
- reviews
- uploaded_files

### MongoDB Collections

- carts
- product_variants
- categories
- wishlists

## Authentication

The API uses JWT (JSON Web Tokens) for authentication with:

- Access tokens (1-hour expiry by default)
- Refresh tokens (7-day expiry by default)
- Role-based access control (RBAC)

Available roles:

- Admin
- Seller
- Customer

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

API docs available at `/api/docs` (Swagger UI)

## Configuration

- Use `.env` for environment variables
- All configs via NestJS ConfigService

---

> **Note:** This backend is API-only. No frontend code is included.
