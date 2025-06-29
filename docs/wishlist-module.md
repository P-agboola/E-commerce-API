# Wishlist Module Documentation

The Wishlist module enables users to save products they're interested in for future reference. This document provides details on implementing and using the Wishlist functionality in the e-commerce platform.

## Overview

The Wishlist module allows authenticated users to:

- Retrieve their wishlist
- Add products to their wishlist
- Remove products from their wishlist
- Clear their entire wishlist

Unlike the cart, the wishlist only stores product references without quantity or variant information. It's designed for lightweight product tracking rather than purchase preparation.

## Schema

The Wishlist is stored in MongoDB with the following schema:

```typescript
@Schema({ timestamps: true })
export class Wishlist {
  _id: string; // MongoDB ID

  @Prop({ required: true, unique: true })
  userId: string; // User ID (must be unique)

  @Prop({ type: [String], default: [] })
  products: string[]; // Array of product IDs

  createdAt: Date; // Creation timestamp
  updatedAt: Date; // Last update timestamp
}
```

## API Endpoints

### GET /wishlist

Retrieves the current user's wishlist with fully expanded product details.

**Authentication:** Required (JWT)

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
    // Additional products...
  ],
  "createdAt": "2023-06-28T15:00:00.000Z",
  "updatedAt": "2023-06-28T17:00:00.000Z"
}
```

### POST /wishlist/items/:productId

Adds a product to the user's wishlist.

**Authentication:** Required (JWT)

**Parameters:**

- `productId` (path): The ID of the product to add

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

### DELETE /wishlist/items/:productId

Removes a product from the user's wishlist.

**Authentication:** Required (JWT)

**Parameters:**

- `productId` (path): The ID of the product to remove

**Response:**

```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "products": [], // Updated products array without the removed item
  "createdAt": "2023-06-28T15:00:00.000Z",
  "updatedAt": "2023-06-28T17:00:00.000Z"
}
```

### DELETE /wishlist/clear

Clears all products from the user's wishlist.

**Authentication:** Required (JWT)

**Response:**

```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "products": [], // Empty array
  "createdAt": "2023-06-28T15:00:00.000Z",
  "updatedAt": "2023-06-28T17:00:00.000Z"
}
```

## Implementation Details

### Services

The `WishlistService` provides methods for managing wishlists:

- **findByUserId**: Retrieves a user's wishlist, creating one if it doesn't exist
- **create**: Creates a new wishlist for a user
- **addItem**: Adds a product to a user's wishlist
- **removeItem**: Removes a product from a user's wishlist
- **clear**: Removes all products from a user's wishlist

### Controller

The `WishlistController` exposes endpoints for wishlist operations:

```typescript
@Controller('wishlist')
export class WishlistController {
  @Get()                                   // Get user's wishlist
  @Post('items/:productId')                // Add product to wishlist
  @Delete('items/:productId')              // Remove product from wishlist
  @Delete('clear')                         // Clear wishlist
}
```

## Integration with Other Modules

The Wishlist module integrates with:

1. **Product Module**: To verify products exist before adding them to wishlists
2. **Auth Module**: To secure endpoints and identify users

## Frontend Integration Guidelines

When integrating with a frontend application:

1. **Wishlist Button on Product Pages**
   - Check if the product is already in the user's wishlist
   - Toggle product wishlist status with appropriate API calls

2. **Wishlist Page**
   - Display products with images, names, and prices
   - Provide "Add to Cart" and "Remove" actions
   - Show "Clear All" button for removing all items

3. **Wishlist Indicator**
   - Show count of wishlist items in the navigation
   - Update count reactively when items are added/removed

## Error Handling

The Wishlist module handles the following errors:

- **Product Not Found**: When trying to add a non-existent product
- **Wishlist Not Found**: When trying to modify a non-existent wishlist
- **Authentication Errors**: When unauthenticated users try to access the wishlist

Each error returns an appropriate HTTP status code and error message.
