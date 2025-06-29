# Database Schema Documentation

This document provides a comprehensive overview of the database schema used in the E-commerce backend.

## Database Systems

The application uses three different database systems for different purposes:

1. **PostgreSQL**: For structured relational data (users, products, orders, etc.)
2. **MongoDB**: For flexible, unstructured data (cart, wishlist, etc.)
3. **Redis**: For caching and session management

## PostgreSQL Schema

### Entity Relationship Diagram

```
┌───────────────┐        ┌───────────────┐        ┌───────────────┐
│     User      │        │    Product    │        │   Category    │
├───────────────┤        ├───────────────┤        ├───────────────┤
│ id            │        │ id            │        │ id            │
│ email         │◄───┐   │ name          │   ┌────┤ name          │
│ password      │    │   │ description   │   │    │ description   │
│ firstName     │    │   │ price         │   │    │ slug          │
│ lastName      │    │   │ sku           │   │    │ parentId      │
│ role          │    │   │ stock         │   │    │ isActive      │
│ isActive      │    │   │ categoryId    │───┘    │ createdAt     │
│ lastLogin     │    │   │ featured      │        │ updatedAt     │
│ createdAt     │    │   │ isActive      │        └───────────────┘
│ updatedAt     │    │   │ createdAt     │
└───────────────┘    │   │ updatedAt     │
        │            │   └───────────────┘
        │            │           │
        ▼            │           ▼
┌───────────────┐    │   ┌───────────────┐        ┌───────────────┐
│    Address    │    │   │    Review     │        │ UploadedFile  │
├───────────────┤    │   ├───────────────┤        ├───────────────┤
│ id            │    │   │ id            │        │ id            │
│ userId        │────┘   │ productId     │───┐    │ originalName  │
│ address       │        │ userId        │───┼────│ filename      │
│ city          │        │ rating        │   │    │ mimeType      │
│ state         │        │ title         │   │    │ size          │
│ zipCode       │        │ content       │   │    │ url           │
│ country       │        │ isApproved    │   │    │ localPath     │
│ isDefault     │        │ createdAt     │   │    │ fileType      │
│ createdAt     │        │ updatedAt     │   │    │ entityId      │
│ updatedAt     │        └───────────────┘   │    │ entityType    │
└───────────────┘                            │    │ createdAt     │
        │                                    │    └───────────────┘
        │                                    │
        └────────────┐                       │
                     ▼                       │
┌───────────────┐    │   ┌───────────────┐   │
│     Order     │    │   │   OrderItem   │   │
├───────────────┤    │   ├───────────────┤   │
│ id            │    │   │ id            │   │
│ orderNumber   │    │   │ orderId       │───┘
│ userId        │────┘   │ productId     │
│ status        │◄───────│ variantId     │
│ shippingAddId │        │ quantity      │
│ billingAddId  │        │ price         │
│ paymentMethod │        │ name          │
│ subtotal      │        │ variantName   │
│ tax           │        │ createdAt     │
│ shipping      │        │ updatedAt     │
│ discount      │        └───────────────┘
│ total         │
│ notes         │        ┌───────────────┐
│ createdAt     │        │    Coupon     │
│ updatedAt     │        ├───────────────┤
└───────────────┘        │ id            │
                         │ code          │
                         │ type          │
                         │ value         │
                         │ minPurchase   │
                         │ maxUses       │
                         │ usedCount     │
                         │ startDate     │
                         │ endDate       │
                         │ isActive      │
                         │ createdAt     │
                         │ updatedAt     │
                         └───────────────┘
```

### Key Tables

#### Users

| Column    | Type         | Description                         |
| --------- | ------------ | ----------------------------------- |
| id        | UUID         | Primary key                         |
| email     | VARCHAR(255) | Unique email address                |
| password  | VARCHAR(255) | Bcrypt hashed password              |
| firstName | VARCHAR(100) | User's first name                   |
| lastName  | VARCHAR(100) | User's last name                    |
| role      | ENUM         | User role (ADMIN, CUSTOMER, SELLER) |
| isActive  | BOOLEAN      | Account status                      |
| lastLogin | TIMESTAMP    | Last login timestamp                |
| createdAt | TIMESTAMP    | Record creation timestamp           |
| updatedAt | TIMESTAMP    | Record last update timestamp        |

#### Products

| Column      | Type          | Description                  |
| ----------- | ------------- | ---------------------------- |
| id          | UUID          | Primary key                  |
| name        | VARCHAR(255)  | Product name                 |
| description | TEXT          | Product description          |
| price       | DECIMAL(10,2) | Base product price           |
| sku         | VARCHAR(100)  | Stock keeping unit           |
| stock       | INTEGER       | Available inventory quantity |
| categoryId  | UUID          | Foreign key to categories    |
| featured    | BOOLEAN       | Featured product flag        |
| isActive    | BOOLEAN       | Product availability status  |
| createdAt   | TIMESTAMP     | Record creation timestamp    |
| updatedAt   | TIMESTAMP     | Record last update timestamp |

#### Orders

| Column        | Type          | Description                  |
| ------------- | ------------- | ---------------------------- |
| id            | UUID          | Primary key                  |
| orderNumber   | VARCHAR(50)   | Human-readable order number  |
| userId        | UUID          | Foreign key to users         |
| status        | ENUM          | Order status                 |
| shippingAddId | UUID          | Foreign key to addresses     |
| billingAddId  | UUID          | Foreign key to addresses     |
| paymentMethod | VARCHAR(50)   | Payment method used          |
| subtotal      | DECIMAL(10,2) | Order subtotal               |
| tax           | DECIMAL(10,2) | Tax amount                   |
| shipping      | DECIMAL(10,2) | Shipping cost                |
| discount      | DECIMAL(10,2) | Discount amount              |
| total         | DECIMAL(10,2) | Total order amount           |
| notes         | TEXT          | Order notes                  |
| createdAt     | TIMESTAMP     | Record creation timestamp    |
| updatedAt     | TIMESTAMP     | Record last update timestamp |

## MongoDB Schema

### Collections

#### Cart

```json
{
  "_id": "ObjectId",
  "userId": "String (UUID)",
  "items": [
    {
      "productId": "String (UUID)",
      "name": "String",
      "price": "Number",
      "quantity": "Number",
      "variantId": "String (UUID or null)",
      "variantName": "String or null",
      "image": "String (URL)"
    }
  ],
  "couponCode": "String or null",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Wishlist

```json
{
  "_id": "ObjectId",
  "userId": "String (UUID)",
  "products": ["String (Product UUID)"],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

**Note**: The wishlist schema stores product IDs as references. When retrieved through the API, these IDs are expanded to full product details.

#### Product Variants

```json
{
  "_id": "ObjectId",
  "productId": "String (UUID)",
  "name": "String",
  "sku": "String",
  "price": "Number",
  "stock": "Number",
  "attributes": {
    "color": "String",
    "size": "String",
    "weight": "Number",
    "material": "String",
    "customAttributes": "Object"
  },
  "isActive": "Boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Categories

```json
{
  "_id": "ObjectId",
  "name": "String",
  "slug": "String",
  "description": "String",
  "parentId": "ObjectId or null",
  "level": "Number",
  "path": "Array of ObjectIds",
  "image": "String (URL)",
  "featured": "Boolean",
  "isActive": "Boolean",
  "metadata": {
    "title": "String",
    "description": "String",
    "keywords": "Array of Strings"
  },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Redis Usage

### Key Patterns

| Key Pattern               | Description                      | TTL  |
| ------------------------- | -------------------------------- | ---- |
| `session:{sessionId}`     | User session data                | 24h  |
| `user:token:{userId}`     | User refresh tokens              | 7d   |
| `rl:{ip}:{endpoint}`      | Rate limiting data               | 1m   |
| `cache:products:{filter}` | Cached product listings          | 10m  |
| `cache:product:{id}`      | Cached individual product        | 30m  |
| `cart:count:{userId}`     | Cart item count for quick access | None |

### Data Structures

#### Session Data

```
HASH session:{sessionId}
- userId: "user-uuid"
- role: "customer"
- lastAccess: "timestamp"
```

#### Rate Limiting

```
INCR rl:{ip}:{endpoint}
EXPIRE rl:{ip}:{endpoint} 60
```

#### Product Cache

```
STRING cache:product:{id} = "{serialized-json-data}"
```

## Database Security

1. **PostgreSQL**:
   - SSL connection in production
   - Role-based access control
   - Row-level security for multi-tenant data
   - Encrypted sensitive data (PII)

2. **MongoDB**:
   - TLS/SSL for connections
   - Authentication required
   - IP whitelisting in production
   - Field-level encryption for sensitive data

3. **Redis**:
   - Password authentication
   - No direct external access (internal network only)
   - Optional TLS in production

## Backup Strategy

1. **PostgreSQL**:
   - Daily full backups
   - Point-in-time recovery with WAL archiving
   - 30-day retention

2. **MongoDB**:
   - Daily backups with mongodump
   - Replica set for redundancy
   - 14-day retention

3. **Redis**:
   - RDB snapshots every hour
   - AOF persistence (appendonly) enabled
   - Redis Sentinel for high availability

## Migration Strategy

Database migrations are managed through:

1. **PostgreSQL**: TypeORM migrations
2. **MongoDB**: Manual collection updates with versioning

The migration files are stored in the `/migrations` directory and can be run with:

```bash
npm run migration:run
```
