# E-commerce Backend API Documentation

This document provides comprehensive information about the E-commerce backend API, including architecture, modules, endpoints, and implementation details.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Database Structure](#database-structure)
5. [Authentication & Authorization](#authentication--authorization)
6. [API Endpoints](#api-endpoints)
7. [Payment Integration](#payment-integration)
8. [Error Handling](#error-handling)
9. [Testing](#testing)
10. [Deployment](#deployment)
11. [Future Improvements](#future-improvements)

## Project Overview

This project is a modular, production-ready e-commerce backend API built with NestJS and TypeScript. It follows clean architecture principles and best practices to provide a scalable and maintainable solution for online shopping platforms.

Key features include:

- User authentication and role-based access control
- Product catalog management with categories and variants
- Shopping cart and wishlists
- Order processing and tracking
- Payment integration
- Coupon and discount management
- Reviews and ratings
- File uploads with Cloudinary integration
- Analytics data collection

## Architecture

The application follows a clean architecture approach with clear separation of concerns:

### Core Layer

- Database connections and configuration
- Cross-cutting concerns

### Module Layer

- Feature modules (auth, user, product, etc.)
- Each module encapsulates related functionality

### Shared Layer

- Common utilities, interfaces, and DTOs
- Reusable components

### Lib Layer

- Base entities and DTOs
- Decorators and guards
- Utility functions

## Technology Stack

- **Framework**: NestJS 11.x (Node.js)
- **Language**: TypeScript 5.x
- **Databases**:
  - PostgreSQL (via TypeORM) for relational data
  - MongoDB (via Mongoose) for unstructured data
  - Redis for caching and sessions
- **Authentication**: JWT with refresh tokens
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator and class-transformer
- **File Storage**: Local + Cloudinary
- **Testing**: Jest

## Database Structure

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

### Redis

- Sessions
- Cache
- Rate limiting

## Authentication & Authorization

The API uses JWT (JSON Web Tokens) for authentication with:

- Access tokens (1-hour expiry by default)
- Refresh tokens (7-day expiry by default)
- Role-based access control (RBAC)

Available roles:

- Admin
- Seller
- Customer

## API Endpoints

### Auth Module

#### `POST /api/auth/register`

Register a new user account.

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "role": "customer"
}
```

**Response:**

```json
{
  "user": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "customer",
    "createdAt": "timestamp"
  },
  "tokens": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

#### `POST /api/auth/login`

Authenticate a user and get access tokens.

**Request Body:**

```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

**Response:** Same as register endpoint.

#### `POST /api/auth/refresh`

Get new access token using refresh token.

**Request Body:**

```json
{
  "refreshToken": "refresh_token"
}
```

**Response:**

```json
{
  "accessToken": "new_jwt_token",
  "refreshToken": "new_refresh_token"
}
```

#### `POST /api/auth/logout`

Log out a user by invalidating their refresh token.

**Request Headers:**

- Authorization: Bearer {token}

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

### User Module

#### `GET /api/users`

Get all users (Admin only).

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "customer",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "hasNextPage": false,
  "hasPreviousPage": false
}
```

#### `GET /api/users/:id`

Get a single user by ID.

**Response:**

```json
{
  "id": "uuid",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "role": "customer",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### `PUT /api/users/:id`

Update user information.

**Request Body:**

```json
{
  "firstName": "Johnny",
  "lastName": "Doeson"
}
```

**Response:**

```json
{
  "id": "uuid",
  "firstName": "Johnny",
  "lastName": "Doeson",
  "email": "john.doe@example.com",
  "role": "customer",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### `DELETE /api/users/:id`

Delete a user (soft delete).

**Response:**

```json
{
  "message": "User deleted successfully"
}
```

### Product Module

#### `GET /api/products`

Get all products with optional filtering, sorting, and pagination.

**Query Parameters:**

- page: Page number (default: 1)
- limit: Items per page (default: 10)
- search: Search term
- category: Filter by category
- minPrice: Minimum price
- maxPrice: Maximum price
- sort: Sort field
- order: Sort order ('asc' or 'desc')

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Product Name",
      "description": "Product description",
      "price": 99.99,
      "discountPrice": 79.99,
      "quantity": 100,
      "images": ["url1", "url2"],
      "categories": ["category1", "category2"],
      "tags": ["tag1", "tag2"],
      "status": "active",
      "featured": false,
      "rating": 4.5,
      "reviewCount": 10,
      "sellerId": "uuid",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

#### `GET /api/products/:id`

Get a single product by ID.

**Response:**

```json
{
  "id": "uuid",
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "discountPrice": 79.99,
  "quantity": 100,
  "images": ["url1", "url2"],
  "categories": ["category1", "category2"],
  "tags": ["tag1", "tag2"],
  "status": "active",
  "featured": false,
  "rating": 4.5,
  "reviewCount": 10,
  "sellerId": "uuid",
  "seller": {
    "id": "uuid",
    "firstName": "Seller",
    "lastName": "Name"
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "variants": [
    {
      "id": "uuid",
      "sku": "SKU123",
      "attributes": {
        "color": "red",
        "size": "M"
      },
      "price": 99.99,
      "quantity": 30
    }
  ]
}
```

#### `POST /api/products`

Create a new product (Seller and Admin only).

**Request Body:**

```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "discountPrice": 79.99,
  "quantity": 100,
  "images": ["url1", "url2"],
  "categories": ["category1", "category2"],
  "tags": ["tag1", "tag2"],
  "status": "active",
  "featured": false,
  "sku": "SKU123",
  "attributes": {
    "material": "cotton",
    "brand": "BrandName"
  }
}
```

**Response:** The created product object.

#### `PUT /api/products/:id`

Update a product (Seller owner and Admin only).

**Request Body:** Same format as create, fields are optional.

**Response:** The updated product object.

#### `DELETE /api/products/:id`

Delete a product (Seller owner and Admin only).

**Response:**

```json
{
  "message": "Product deleted successfully"
}
```

#### `POST /api/products/:id/variants`

Add a variant to a product.

**Request Body:**

```json
{
  "sku": "SKU-VAR-123",
  "attributes": {
    "color": "red",
    "size": "XL"
  },
  "price": 109.99,
  "quantity": 25
}
```

**Response:** The created variant object.

### Cart Module

#### `GET /api/cart`

Get the current user's cart.

**Response:**

```json
{
  "id": "uuid",
  "userId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "product": {
        "name": "Product Name",
        "price": 99.99,
        "discountPrice": 79.99,
        "image": "url"
      },
      "quantity": 2,
      "variantId": "uuid",
      "variant": {
        "attributes": {
          "color": "red",
          "size": "M"
        }
      },
      "price": 79.99,
      "total": 159.98
    }
  ],
  "subtotal": 159.98,
  "itemCount": 2,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### `POST /api/cart/items`

Add an item to the cart.

**Request Body:**

```json
{
  "productId": "uuid",
  "quantity": 2,
  "variantId": "uuid" // Optional
}
```

**Response:** The updated cart object.

#### `PUT /api/cart/items/:productId`

Update an item in the cart.

**Request Body:**

```json
{
  "quantity": 3,
  "variantId": "uuid" // Optional
}
```

**Response:** The updated cart object.

#### `DELETE /api/cart/items/:productId`

Remove an item from the cart.

**Response:** The updated cart object.

#### `DELETE /api/cart/clear`

Clear the entire cart.

**Response:**

```json
{
  "message": "Cart cleared successfully"
}
```

### Order Module

#### `GET /api/orders`

Get all orders for the current user (or all orders for Admin).

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "status": "completed",
      "total": 159.98,
      "items": [
        {
          "productId": "uuid",
          "productName": "Product Name",
          "quantity": 2,
          "price": 79.99,
          "total": 159.98,
          "variantData": {
            "color": "red",
            "size": "M"
          }
        }
      ],
      "shippingAddress": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA"
      },
      "paymentMethod": "credit_card",
      "paymentId": "payment_id",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "hasNextPage": false,
  "hasPreviousPage": false
}
```

#### `GET /api/orders/:id`

Get a single order by ID.

**Response:** The order object.

#### `POST /api/orders`

Create a new order from the cart.

**Request Body:**

```json
{
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "credit_card",
  "couponCode": "SUMMER20" // Optional
}
```

**Response:** The created order object with payment link if applicable.

#### `PUT /api/orders/:id/status`

Update the status of an order (Admin only).

**Request Body:**

```json
{
  "status": "completed"
}
```

**Response:** The updated order object.

#### `DELETE /api/orders/:id`

Cancel an order (if still in processing status).

**Response:**

```json
{
  "message": "Order cancelled successfully"
}
```

### Review Module

#### `GET /api/reviews/product/:productId`

Get all reviews for a product.

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "user": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "productId": "uuid",
      "rating": 5,
      "comment": "Great product!",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "hasNextPage": false,
  "hasPreviousPage": false
}
```

#### `POST /api/reviews`

Create a new product review.

**Request Body:**

```json
{
  "productId": "uuid",
  "rating": 5,
  "comment": "Great product!"
}
```

**Response:** The created review object.

#### `PUT /api/reviews/:id`

Update a review (owner only).

**Request Body:**

```json
{
  "rating": 4,
  "comment": "Updated comment"
}
```

**Response:** The updated review object.

#### `DELETE /api/reviews/:id`

Delete a review (owner or Admin only).

**Response:**

```json
{
  "message": "Review deleted successfully"
}
```

### Coupon Module

#### `GET /api/coupons`

Get all coupons (Admin only).

**Response:** Array of coupon objects.

#### `POST /api/coupons`

Create a new coupon (Admin only).

**Request Body:**

```json
{
  "code": "SUMMER20",
  "type": "percentage", // or "fixed"
  "value": 20, // percentage or fixed amount
  "minimumPurchase": 100, // Optional
  "startsAt": "2023-06-01T00:00:00Z",
  "expiresAt": "2023-08-31T23:59:59Z",
  "maxUses": 1000, // Optional
  "maxUsesPerUser": 1, // Optional
  "products": ["uuid1", "uuid2"], // Optional - restrict to specific products
  "categories": ["category1", "category2"] // Optional - restrict to specific categories
}
```

**Response:** The created coupon object.

#### `POST /api/coupons/validate`

Validate a coupon code.

**Request Body:**

```json
{
  "code": "SUMMER20",
  "cartTotal": 150
}
```

**Response:**

```json
{
  "valid": true,
  "discount": 30,
  "discountedTotal": 120
}
```

### Upload Module

#### `POST /api/uploads`

Upload a file (image, document).

**Request:** Multipart form data with file and optional metadata.

**Response:**

```json
{
  "id": "uuid",
  "originalName": "image.jpg",
  "mimeType": "image/jpeg",
  "size": 12345,
  "url": "/uploads/filename.jpg",
  "cloudinaryUrl": "https://cloudinary.com/...",
  "publicId": "folder/filename",
  "fileType": "image",
  "createdAt": "timestamp"
}
```

#### `GET /api/uploads/:id`

Get uploaded file information.

**Response:** The uploaded file object.

#### `DELETE /api/uploads/:id`

Delete an uploaded file.

**Response:**

```json
{
  "message": "File deleted successfully"
}
```

### Wishlist Module

#### `GET /api/wishlist`

Get the current user's wishlist with complete product details.

**Authentication Required:** Yes (JWT)

**Response:**

```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "products": [
    {
      "id": "g7h8i9j0-k1l2-3456-mnop-qr7890123456",
      "name": "Smartphone Y",
      "description": "Latest model with advanced features",
      "price": 699.99,
      "images": ["https://example.com/images/smartphone-y.jpg"],
      "category": "Electronics",
      "stock": 42,
      "variants": [],
      "specs": {},
      "createdAt": "2023-05-15T10:30:00.000Z",
      "updatedAt": "2023-06-20T14:15:00.000Z"
    }
  ],
  "createdAt": "2023-06-28T15:00:00.000Z",
  "updatedAt": "2023-06-28T17:00:00.000Z"
}
```

#### `POST /api/wishlist/items/:productId`

Add a product to the wishlist.

**Authentication Required:** Yes (JWT)

**Path Parameters:**

- `productId`: ID of the product to add

**Response:**

```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "products": ["g7h8i9j0-k1l2-3456-mnop-qr7890123456"],
  "createdAt": "2023-06-28T15:00:00.000Z",
  "updatedAt": "2023-06-28T17:00:00.000Z"
}
```

#### `DELETE /api/wishlist/items/:productId`

Remove a product from the wishlist.

**Authentication Required:** Yes (JWT)

**Path Parameters:**

- `productId`: ID of the product to remove

**Response:**

```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "products": [],
  "createdAt": "2023-06-28T15:00:00.000Z",
  "updatedAt": "2023-06-28T17:00:00.000Z"
}
```

#### `DELETE /api/wishlist/clear`

Clear the entire wishlist.

**Authentication Required:** Yes (JWT)

**Response:**

```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "products": [],
  "createdAt": "2023-06-28T15:00:00.000Z",
  "updatedAt": "2023-06-28T17:00:00.000Z"
}
```

**For more details, see the [Wishlist Module Documentation](docs/wishlist-module.md).**

## Payment Integration

The E-commerce backend supports multiple payment gateways using a strategy pattern for flexibility and extensibility.

### Supported Payment Providers

- **Stripe**: Credit/debit card processing with Payment Intents API
- **PayPal**: Express checkout and PayPal wallet payments
- **Credit Card**: Direct processing (requires PCI compliance)
- **Bank Transfer**: Manual bank transfer processing

For detailed implementation and integration instructions, see [Payment Integration Guide](./payment-integration-guide.md).

### Payment Endpoints

#### `POST /api/payments`

Create a new payment for an order.

**Request Body:**

```json
{
  "orderId": "uuid",
  "amount": 99.99,
  "provider": "stripe", // or "paypal", "credit_card", "bank_transfer"
  "currency": "USD",
  "description": "Payment for Order #1001"
}
```

**Response:**

```json
{
  "id": "uuid",
  "orderId": "uuid",
  "amount": 99.99,
  "provider": "stripe",
  "status": "pending",
  "paymentIntentId": "pi_123456789",
  "details": {
    "clientSecret": "pi_123456789_secret_123456"
  },
  "createdAt": "timestamp"
}
```

#### `POST /api/payments/:id/finalize`

Finalize a pending payment after client-side processing.

**Request Body:** Provider-specific payment data

**Response:**

```json
{
  "id": "uuid",
  "orderId": "uuid",
  "status": "succeeded",
  "transactionId": "txn_123456789",
  "updatedAt": "timestamp"
}
```

#### `POST /api/payments/:id/refund`

Process a refund for a payment (Admin only).

**Query Parameters:**

- `amount`: (Optional) Amount to refund for partial refunds

**Response:**

```json
{
  "id": "uuid",
  "orderId": "uuid",
  "status": "refunded", // or "partially_refunded"
  "refundId": "re_123456789",
  "refundAmount": 99.99,
  "updatedAt": "timestamp"
}
```

#### `POST /api/payments/webhook/:provider`

Handle webhook notifications from payment providers.

**Request Body:** Provider-specific webhook payload

**Headers:**

- Stripe: `stripe-signature` header for webhook verification
- PayPal: IPN verification headers

**Response:** `200 OK`

### Payment Entity

```typescript
{
  id: string; // UUID
  orderId: string; // Associated order
  amount: number; // Payment amount
  provider: PaymentProvider; // Payment provider enum
  status: PaymentStatus; // Status enum
  transactionId: string; // Provider transaction ID
  paymentIntentId: string; // For Stripe payment intents
  paymentDetails: object; // Provider-specific details
  errorMessage: string; // Error message if failed
  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last update timestamp
}
```

### Payment Flow

1. **Initiate Payment**: Backend creates a payment record and returns provider-specific details
2. **Process Payment**: Frontend completes payment using provider SDK
3. **Finalize Payment**: Backend verifies and updates payment status
4. **Webhook Processing**: Asynchronous updates from payment providers

### Security Considerations

- PCI DSS compliance for credit card processing
- Tokenization of sensitive payment information
- Secure storage of API keys and secrets
- Webhook signature verification
- HTTPS for all communications
- Payment amount validation against order totals

## Error Handling

The API uses a standardized error response format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email must be a valid email address"
    }
  ],
  "timestamp": "2023-06-28T10:15:30Z",
  "path": "/api/auth/register"
}
```

Common error status codes:

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Unprocessable Entity
- 429: Too Many Requests
- 500: Internal Server Error

## Testing

The application includes:

- Unit tests for services and utility functions
- Integration tests for controllers and API endpoints
- E2E tests for complete user flows

Run tests with:

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Deployment

The application is designed to be deployed to:

- Docker containers
- Kubernetes clusters
- Cloud platforms (AWS, GCP, Azure)
- Traditional hosting providers

Environment variables are managed via .env files with the config module.

## Future Improvements

Planned future enhancements:

- Advanced search with Elasticsearch
- Real-time notifications with WebSockets
- Enhanced analytics and reporting
- Internationalization (i18n) support
- GraphQL API alongside REST
- Additional payment gateways
- Multi-vendor marketplace features
