# E-commerce API Endpoint Reference

This document provides a detailed reference for all API endpoints in the E-commerce backend system.

## Base URL

```
http://localhost:3000/api
```

## Authentication Endpoints

### Register a New User

**Endpoint:** `POST /auth/register`

**Description:** Creates a new user account in the system.

**Authentication Required:** No

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "YourSecurePassword123!",
  "passwordConfirmation": "YourSecurePassword123!"
}
```

**Response:** `201 Created`

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "customer"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input data
- `403 Forbidden` - Email already exists

### User Login

**Endpoint:** `POST /auth/login`

**Description:** Authenticates a user and returns auth tokens.

**Authentication Required:** No

**Request Body:**

```json
{
  "email": "john.doe@example.com",
  "password": "YourSecurePassword123!"
}
```

**Response:** `200 OK`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Invalid credentials

### Refresh Token

**Endpoint:** `POST /auth/refresh`

**Description:** Refreshes an expired access token using a valid refresh token.

**Authentication Required:** No

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid refresh token

### Get Current User Profile

**Endpoint:** `GET /auth/me`

**Description:** Retrieves the profile information of the authenticated user.

**Authentication Required:** Yes (JWT)

**Response:** `200 OK`

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "customer",
  "createdAt": "2023-06-28T12:00:00.000Z",
  "updatedAt": "2023-06-28T12:00:00.000Z"
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token

## User Management Endpoints

### Get All Users (Admin Only)

**Endpoint:** `GET /users`

**Description:** Retrieves a list of all users in the system.

**Authentication Required:** Yes (JWT, Admin role)

**Query Parameters:**

- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)

**Response:** `200 OK`

```json
{
  "items": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "customer",
      "createdAt": "2023-06-28T12:00:00.000Z",
      "updatedAt": "2023-06-28T12:00:00.000Z"
    }
    // More users...
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 50,
    "totalPages": 5
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Insufficient permissions

### Get User by ID

**Endpoint:** `GET /users/:id`

**Description:** Retrieves a specific user by ID.

**Authentication Required:** Yes (JWT)

**Response:** `200 OK`

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "customer",
  "createdAt": "2023-06-28T12:00:00.000Z",
  "updatedAt": "2023-06-28T12:00:00.000Z"
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - User not found

### Create User (Admin Only)

**Endpoint:** `POST /users`

**Description:** Creates a new user (admin functionality).

**Authentication Required:** Yes (JWT, Admin role)

**Request Body:**

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "password": "YourSecurePassword123!",
  "role": "customer"
}
```

**Response:** `201 Created`

```json
{
  "id": "b2c3d4e5-f6g7-8901-hijk-lm2345678901",
  "email": "jane.smith@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "customer",
  "createdAt": "2023-06-28T12:00:00.000Z",
  "updatedAt": "2023-06-28T12:00:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Insufficient permissions

### Update User (Admin Only)

**Endpoint:** `PUT /users/:id`

**Description:** Updates an existing user.

**Authentication Required:** Yes (JWT, Admin role)

**Request Body:**

```json
{
  "firstName": "Jane",
  "lastName": "Smith-Johnson",
  "email": "jane.smith@example.com",
  "role": "customer"
}
```

**Response:** `200 OK`

```json
{
  "id": "b2c3d4e5-f6g7-8901-hijk-lm2345678901",
  "email": "jane.smith@example.com",
  "firstName": "Jane",
  "lastName": "Smith-Johnson",
  "role": "customer",
  "createdAt": "2023-06-28T12:00:00.000Z",
  "updatedAt": "2023-06-28T14:00:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - User not found

### Delete User (Admin Only)

**Endpoint:** `DELETE /users/:id`

**Description:** Deletes a user from the system.

**Authentication Required:** Yes (JWT, Admin role)

**Response:** `200 OK`

```json
{
  "message": "User deleted successfully"
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - User not found

## Product Management Endpoints

### Get All Products

**Endpoint:** `GET /products`

**Description:** Retrieves a list of all products.

**Authentication Required:** No

**Query Parameters:**

- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)
- `status` (optional): Filter by product status
- `category` (optional): Filter by category ID
- `search` (optional): Search products by name or description
- `sortBy` (optional): Field to sort by (default: 'createdAt')
- `sortOrder` (optional): Sort order, 'ASC' or 'DESC' (default: 'DESC')

**Response:** `200 OK`

```json
{
  "items": [
    {
      "id": "c3d4e5f6-g7h8-9012-ijkl-mn3456789012",
      "name": "Smartphone X",
      "description": "Latest smartphone model with advanced features",
      "price": 599.99,
      "sku": "PHONE-001",
      "stock": 50,
      "category": {
        "id": "d4e5f6g7-h8i9-0123-jklm-no4567890123",
        "name": "Electronics"
      },
      "images": ["https://example.com/images/smartphone-x.jpg"],
      "featured": true,
      "isActive": true,
      "createdAt": "2023-06-28T12:00:00.000Z",
      "updatedAt": "2023-06-28T12:00:00.000Z"
    }
    // More products...
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10
  }
}
```

### Get Featured Products

**Endpoint:** `GET /products/featured`

**Description:** Retrieves a list of featured products.

**Authentication Required:** No

**Query Parameters:**

- `limit` (optional): Number of items to return (default: 10)

**Response:** `200 OK`

```json
[
  {
    "id": "c3d4e5f6-g7h8-9012-ijkl-mn3456789012",
    "name": "Smartphone X",
    "description": "Latest smartphone model with advanced features",
    "price": 599.99,
    "sku": "PHONE-001",
    "stock": 50,
    "category": {
      "id": "d4e5f6g7-h8i9-0123-jklm-no4567890123",
      "name": "Electronics"
    },
    "images": ["https://example.com/images/smartphone-x.jpg"],
    "featured": true,
    "isActive": true,
    "createdAt": "2023-06-28T12:00:00.000Z",
    "updatedAt": "2023-06-28T12:00:00.000Z"
  }
  // More featured products...
]
```

### Get Products by Category

**Endpoint:** `GET /products/category/:id`

**Description:** Retrieves products belonging to a specific category.

**Authentication Required:** No

**Path Parameters:**

- `id`: ID of the category

**Query Parameters:**

- `limit` (optional): Number of items to return (default: 10)

**Response:** `200 OK`

```json
[
  {
    "id": "c3d4e5f6-g7h8-9012-ijkl-mn3456789012",
    "name": "Smartphone X",
    "description": "Latest smartphone model with advanced features",
    "price": 599.99,
    "sku": "PHONE-001",
    "stock": 50,
    "category": {
      "id": "d4e5f6g7-h8i9-0123-jklm-no4567890123",
      "name": "Electronics"
    },
    "images": ["https://example.com/images/smartphone-x.jpg"],
    "featured": true,
    "isActive": true,
    "createdAt": "2023-06-28T12:00:00.000Z",
    "updatedAt": "2023-06-28T12:00:00.000Z"
  }
  // More products in this category...
]
```

### Get Product by ID

**Endpoint:** `GET /products/:id`

**Description:** Retrieves a specific product by ID.

**Authentication Required:** No

**Response:** `200 OK`

```json
{
  "id": "c3d4e5f6-g7h8-9012-ijkl-mn3456789012",
  "name": "Smartphone X",
  "description": "Latest smartphone model with advanced features",
  "price": 599.99,
  "sku": "PHONE-001",
  "stock": 50,
  "category": {
    "id": "d4e5f6g7-h8i9-0123-jklm-no4567890123",
    "name": "Electronics"
  },
  "tags": ["smartphone", "5G", "camera"],
  "images": ["https://example.com/images/smartphone-x.jpg"],
  "variants": [
    {
      "id": "e5f6g7h8-i9j0-1234-klmn-op5678901234",
      "name": "Black",
      "sku": "PHONE-001-BLK",
      "price": 599.99,
      "stock": 30
    },
    {
      "id": "f6g7h8i9-j0k1-2345-lmno-pq6789012345",
      "name": "White",
      "sku": "PHONE-001-WHT",
      "price": 599.99,
      "stock": 20
    }
  ],
  "featured": true,
  "isActive": true,
  "createdAt": "2023-06-28T12:00:00.000Z",
  "updatedAt": "2023-06-28T12:00:00.000Z"
}
```

**Error Responses:**

- `404 Not Found` - Product not found

### Create Product (Admin/Seller Only)

**Endpoint:** `POST /products`

**Description:** Creates a new product.

**Authentication Required:** Yes (JWT, Admin/Seller role)

**Request Body:**

```json
{
  "name": "Smartphone Y",
  "description": "Next-generation smartphone with AI capabilities",
  "price": 699.99,
  "sku": "PHONE-002",
  "stock": 40,
  "categoryId": "d4e5f6g7-h8i9-0123-jklm-no4567890123",
  "tags": ["smartphone", "AI", "5G"],
  "images": ["https://example.com/images/smartphone-y.jpg"],
  "featured": false,
  "variants": [
    {
      "name": "Black",
      "sku": "PHONE-002-BLK",
      "price": 699.99,
      "stock": 25
    },
    {
      "name": "Silver",
      "sku": "PHONE-002-SLV",
      "price": 729.99,
      "stock": 15
    }
  ]
}
```

**Response:** `201 Created`

```json
{
  "id": "g7h8i9j0-k1l2-3456-mnop-qr7890123456",
  "name": "Smartphone Y",
  "description": "Next-generation smartphone with AI capabilities",
  "price": 699.99,
  "sku": "PHONE-002",
  "stock": 40,
  "category": {
    "id": "d4e5f6g7-h8i9-0123-jklm-no4567890123",
    "name": "Electronics"
  },
  "tags": ["smartphone", "AI", "5G"],
  "images": ["https://example.com/images/smartphone-y.jpg"],
  "variants": [
    {
      "id": "h8i9j0k1-l2m3-4567-nopq-rs8901234567",
      "name": "Black",
      "sku": "PHONE-002-BLK",
      "price": 699.99,
      "stock": 25
    },
    {
      "id": "i9j0k1l2-m3n4-5678-opqr-st9012345678",
      "name": "Silver",
      "sku": "PHONE-002-SLV",
      "price": 729.99,
      "stock": 15
    }
  ],
  "featured": false,
  "isActive": true,
  "createdAt": "2023-06-28T15:00:00.000Z",
  "updatedAt": "2023-06-28T15:00:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Insufficient permissions

## Shopping Cart Endpoints

### Get User's Cart

**Endpoint:** `GET /cart`

**Description:** Retrieves the current user's shopping cart.

**Authentication Required:** Yes (JWT)

**Response:** `200 OK`

```json
{
  "cart": {
    "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "items": [
      {
        "productId": "c3d4e5f6-g7h8-9012-ijkl-mn3456789012",
        "name": "Smartphone X",
        "price": 599.99,
        "quantity": 1,
        "variantId": "e5f6g7h8-i9j0-1234-klmn-op5678901234",
        "variantName": "Black",
        "image": "https://example.com/images/smartphone-x.jpg"
      }
    ],
    "couponCode": null,
    "createdAt": "2023-06-28T16:00:00.000Z",
    "updatedAt": "2023-06-28T16:00:00.000Z"
  },
  "totals": {
    "subtotal": 599.99,
    "tax": 60.0,
    "shipping": 10.0,
    "discount": 0,
    "total": 669.99
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token

### Add Item to Cart

**Endpoint:** `POST /cart/items`

**Description:** Adds a new item to the user's shopping cart.

**Authentication Required:** Yes (JWT)

**Request Body:**

```json
{
  "productId": "c3d4e5f6-g7h8-9012-ijkl-mn3456789012",
  "quantity": 1,
  "variantId": "e5f6g7h8-i9j0-1234-klmn-op5678901234"
}
```

**Response:** `201 Created`

```json
{
  "cart": {
    "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "items": [
      {
        "productId": "c3d4e5f6-g7h8-9012-ijkl-mn3456789012",
        "name": "Smartphone X",
        "price": 599.99,
        "quantity": 1,
        "variantId": "e5f6g7h8-i9j0-1234-klmn-op5678901234",
        "variantName": "Black",
        "image": "https://example.com/images/smartphone-x.jpg"
      }
    ],
    "couponCode": null,
    "createdAt": "2023-06-28T16:00:00.000Z",
    "updatedAt": "2023-06-28T16:00:00.000Z"
  },
  "totals": {
    "subtotal": 599.99,
    "tax": 60.0,
    "shipping": 10.0,
    "discount": 0,
    "total": 669.99
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Product not found

## Order Management Endpoints

### Create Order

**Endpoint:** `POST /orders`

**Description:** Creates a new order from the user's cart.

**Authentication Required:** Yes (JWT)

**Request Body:**

```json
{
  "shippingAddress": {
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "credit_card",
  "paymentDetails": {
    "cardNumber": "************1234",
    "cardType": "visa"
  }
}
```

**Response:** `201 Created`

```json
{
  "id": "j0k1l2m3-n4o5-6789-pqrs-tu0123456789",
  "orderNumber": "ORD-20230628-001",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "john.doe@example.com"
  },
  "status": "pending",
  "items": [
    {
      "productId": "c3d4e5f6-g7h8-9012-ijkl-mn3456789012",
      "name": "Smartphone X",
      "price": 599.99,
      "quantity": 1,
      "variantId": "e5f6g7h8-i9j0-1234-klmn-op5678901234",
      "variantName": "Black"
    }
  ],
  "totals": {
    "subtotal": 599.99,
    "tax": 60.0,
    "shipping": 10.0,
    "discount": 0,
    "total": 669.99
  },
  "shippingAddress": {
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "createdAt": "2023-06-28T16:30:00.000Z",
  "updatedAt": "2023-06-28T16:30:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input data or empty cart
- `401 Unauthorized` - Invalid or missing token

### Get User Orders

**Endpoint:** `GET /orders`

**Description:** Retrieves all orders for the current user.

**Authentication Required:** Yes (JWT)

**Response:** `200 OK`

```json
[
  {
    "id": "j0k1l2m3-n4o5-6789-pqrs-tu0123456789",
    "orderNumber": "ORD-20230628-001",
    "status": "pending",
    "totals": {
      "subtotal": 599.99,
      "tax": 60.0,
      "shipping": 10.0,
      "discount": 0,
      "total": 669.99
    },
    "createdAt": "2023-06-28T16:30:00.000Z",
    "updatedAt": "2023-06-28T16:30:00.000Z"
  }
]
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token

## File Upload Endpoints

### Upload File

**Endpoint:** `POST /uploads`

**Description:** Uploads a file (image or document).

**Authentication Required:** Yes (JWT)

**Request Body:** Multipart form data

- `file`: The file to upload
- `fileType`: Type of file ('image', 'document', or 'other')
- `folder`: Optional folder name (e.g., 'products')
- `entityId`: Optional related entity ID
- `entityType`: Optional related entity type

**Response:** `201 Created`

```json
{
  "id": "k1l2m3n4-o5p6-7890-qrst-uv1234567890",
  "originalName": "product-image.jpg",
  "filename": "a1b2c3d4e5f6.jpg",
  "mimeType": "image/jpeg",
  "size": 102400,
  "url": "https://res.cloudinary.com/sample/image/upload/v1624617473/a1b2c3d4e5f6.jpg",
  "localPath": "/uploads/a1b2c3d4e5f6.jpg",
  "fileType": "image",
  "folder": "products",
  "entityId": "c3d4e5f6-g7h8-9012-ijkl-mn3456789012",
  "entityType": "product",
  "createdAt": "2023-06-28T14:00:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid file or file too large
- `401 Unauthorized` - Invalid or missing token

## Review Endpoints

### Get Product Reviews

**Endpoint:** `GET /reviews/product/:id`

**Description:** Retrieves reviews for a specific product.

**Authentication Required:** No

**Path Parameters:**

- `id`: ID of the product

**Query Parameters:**

- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)

**Response:** `200 OK`

```json
{
  "items": [
    {
      "id": "l2m3n4o5-p6q7-8901-rstu-vw2345678901",
      "productId": "c3d4e5f6-g7h8-9012-ijkl-mn3456789012",
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "userName": "John D.",
      "rating": 4.5,
      "title": "Great phone",
      "content": "This is an excellent smartphone with great features. Camera quality is superb.",
      "createdAt": "2023-06-29T09:00:00.000Z",
      "updatedAt": "2023-06-29T09:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

## Coupon Endpoints

### Apply Coupon

**Endpoint:** `POST /coupons/apply`

**Description:** Applies a coupon code to the user's cart.

**Authentication Required:** Yes (JWT)

**Request Body:**

```json
{
  "code": "SUMMER2023"
}
```

**Response:** `200 OK`

```json
{
  "discount": 50.0,
  "message": "Coupon applied successfully",
  "cart": {
    // Updated cart with coupon applied
  },
  "totals": {
    "subtotal": 599.99,
    "tax": 60.0,
    "shipping": 10.0,
    "discount": 50.0,
    "total": 619.99
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid coupon code
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Coupon not found

## Wishlist Endpoints

### Get User's Wishlist

**Endpoint:** `GET /wishlist`

**Description:** Retrieves the current user's wishlist with full product details.

**Authentication Required:** Yes (JWT)

**Response:** `200 OK`

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

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token

### Add Item to Wishlist

**Endpoint:** `POST /wishlist/items/:productId`

**Description:** Adds a product to the user's wishlist.

**Authentication Required:** Yes (JWT)

**Path Parameters:**

- `productId`: ID of the product to add

**Response:** `201 Created`

```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "products": ["g7h8i9j0-k1l2-3456-mnop-qr7890123456"],
  "createdAt": "2023-06-28T15:00:00.000Z",
  "updatedAt": "2023-06-28T17:00:00.000Z"
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Product not found

### Remove Item from Wishlist

**Endpoint:** `DELETE /wishlist/items/:productId`

**Description:** Removes a product from the user's wishlist.

**Authentication Required:** Yes (JWT)

**Path Parameters:**

- `productId`: ID of the product to remove

**Response:** `200 OK`

```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "products": [],
  "createdAt": "2023-06-28T15:00:00.000Z",
  "updatedAt": "2023-06-28T17:00:00.000Z"
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Wishlist not found

### Clear Wishlist

**Endpoint:** `DELETE /wishlist/clear`

**Description:** Removes all products from the user's wishlist.

**Authentication Required:** Yes (JWT)

**Response:** `200 OK`

```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "products": [],
  "createdAt": "2023-06-28T15:00:00.000Z",
  "updatedAt": "2023-06-28T17:00:00.000Z"
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Wishlist not found

## Analytics Endpoints (Admin Only)

### Get Sales Analytics

**Endpoint:** `GET /analytics/sales`

**Description:** Retrieves sales analytics data.

**Authentication Required:** Yes (JWT, Admin role)

**Query Parameters:**

- `startDate` (optional): Start date for the analysis period
- `endDate` (optional): End date for the analysis period

**Response:** `200 OK`

```json
{
  "totalSales": 10000.0,
  "orderCount": 150,
  "averageOrderValue": 66.67,
  "salesByPeriod": [
    {
      "period": "2023-06-01",
      "sales": 500.0,
      "orders": 8
    }
    // More period data...
  ],
  "topSellingProducts": [
    {
      "id": "c3d4e5f6-g7h8-9012-ijkl-mn3456789012",
      "name": "Smartphone X",
      "totalSales": 2000.0,
      "quantitySold": 4
    }
    // More products...
  ]
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Insufficient permissions

## Payment Endpoints

### Create Payment

**Endpoint:** `POST /payments`

**Description:** Initiates a new payment for an order using the specified payment provider.

**Authentication Required:** Yes (JWT)

**Request Body:**

```json
{
  "orderId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "amount": 99.99,
  "provider": "stripe",
  "currency": "USD",
  "description": "Payment for Order #1001"
}
```

**Response:** `201 Created`

```json
{
  "id": "p1q2r3s4-t5u6-7890-vwxy-z0123456789",
  "orderId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "amount": 99.99,
  "provider": "stripe",
  "status": "pending",
  "paymentIntentId": "pi_3N7RtQKZUoZMN9f50NLUPFXJ",
  "paymentDetails": {
    "clientSecret": "pi_3N7RtQKZUoZMN9f50NLUPFXJ_secret_7L1AhbDQrsFLaqF4onTqGDi4p"
  },
  "createdAt": "2023-06-28T18:00:00.000Z",
  "updatedAt": "2023-06-28T18:00:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Order not found

### Finalize Payment

**Endpoint:** `POST /payments/:id/finalize`

**Description:** Completes a payment after client-side processing.

**Authentication Required:** Yes (JWT)

**Path Parameters:**

- `id`: The payment ID to finalize

**Request Body (Stripe):**

```json
{
  "paymentIntentId": "pi_3N7RtQKZUoZMN9f50NLUPFXJ",
  "paymentMethodId": "pm_1N7RuIKZUoZMN9f5mHUhpJGQ"
}
```

**Request Body (PayPal):**

```json
{
  "paypalOrderId": "2KY458484G382993F",
  "payerId": "QGTXK7S9GBLUC"
}
```

**Response:** `200 OK`

```json
{
  "id": "p1q2r3s4-t5u6-7890-vwxy-z0123456789",
  "orderId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "amount": 99.99,
  "provider": "stripe",
  "status": "succeeded",
  "transactionId": "ch_3N7RtQKZUoZMN9f50zViGgX9",
  "paymentIntentId": "pi_3N7RtQKZUoZMN9f50NLUPFXJ",
  "paymentDetails": {
    "last4": "4242",
    "brand": "visa",
    "receiptUrl": "https://receipt.stripe.com/example"
  },
  "createdAt": "2023-06-28T18:00:00.000Z",
  "updatedAt": "2023-06-28T18:10:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request` - Payment processing failed
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Payment not found

### Process Payment Webhook

**Endpoint:** `POST /payments/webhook/:provider`

**Description:** Handles webhook notifications from payment providers about payment status changes.

**Authentication Required:** No (Uses provider-specific verification)

**Path Parameters:**

- `provider`: Payment provider name (stripe, paypal)

**Headers (Stripe):**

- `stripe-signature`: Webhook signature for verification

**Request Body:** Provider-specific webhook payload

**Response:** `200 OK`

```json
{
  "received": true
}
```

**Error Responses:**

- `400 Bad Request` - Invalid webhook payload or signature

### Refund Payment

**Endpoint:** `POST /payments/:id/refund`

**Description:** Processes a full or partial refund for a payment.

**Authentication Required:** Yes (JWT, Admin role)

**Path Parameters:**

- `id`: Payment ID to refund

**Query Parameters:**

- `amount`: (Optional) Amount to refund for partial refunds

**Response:** `200 OK`

```json
{
  "id": "p1q2r3s4-t5u6-7890-vwxy-z0123456789",
  "orderId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "amount": 99.99,
  "refundedAmount": 99.99,
  "provider": "stripe",
  "status": "refunded",
  "transactionId": "ch_3N7RtQKZUoZMN9f50zViGgX9",
  "refundId": "re_3N7RtQKZUoZMN9f50mBuZXiG",
  "updatedAt": "2023-06-29T10:00:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid refund request
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Payment not found

### Get Payment by ID

**Endpoint:** `GET /payments/:id`

**Description:** Retrieves payment details by ID.

**Authentication Required:** Yes (JWT)

**Path Parameters:**

- `id`: Payment ID

**Response:** `200 OK`

```json
{
  "id": "p1q2r3s4-t5u6-7890-vwxy-z0123456789",
  "orderId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "amount": 99.99,
  "provider": "stripe",
  "status": "succeeded",
  "transactionId": "ch_3N7RtQKZUoZMN9f50zViGgX9",
  "paymentIntentId": "pi_3N7RtQKZUoZMN9f50NLUPFXJ",
  "paymentDetails": {
    "last4": "4242",
    "brand": "visa",
    "receiptUrl": "https://receipt.stripe.com/example"
  },
  "createdAt": "2023-06-28T18:00:00.000Z",
  "updatedAt": "2023-06-28T18:10:00.000Z"
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Payment not found

### Get Order Payments

**Endpoint:** `GET /payments/order/:orderId`

**Description:** Retrieves all payments associated with an order.

**Authentication Required:** Yes (JWT)

**Path Parameters:**

- `orderId`: Order ID

**Response:** `200 OK`

```json
[
  {
    "id": "p1q2r3s4-t5u6-7890-vwxy-z0123456789",
    "orderId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "amount": 99.99,
    "provider": "stripe",
    "status": "succeeded",
    "transactionId": "ch_3N7RtQKZUoZMN9f50zViGgX9",
    "createdAt": "2023-06-28T18:00:00.000Z",
    "updatedAt": "2023-06-28T18:10:00.000Z"
  }
]
```

**Error Responses:**

- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - Order not found
