# Wishlist Module Development Guide

## Overview

The Wishlist module allows users to save products they are interested in for future reference or purchase. This document provides technical details for developers working on the wishlist feature.

## Setup and Dependencies

The Wishlist module requires:

1. MongoDB configured in the application
2. Product module for product reference validation
3. Auth module for user authentication

## Schema Implementation

The wishlist schema is implemented using Mongoose:

```typescript
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type WishlistDocument = Wishlist & Document;

@Schema({ timestamps: true })
export class Wishlist {
  @ApiProperty({ description: 'MongoDB ID field' })
  _id: string;

  @ApiProperty({ description: 'User ID' })
  @Prop({ required: true, unique: true })
  userId: string;

  @ApiProperty({ description: 'Products in the wishlist' })
  @Prop({ type: [String], default: [] })
  products: string[];

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);
```

## Service Methods

### `findByUserId(userId: string)`

Retrieves a user's wishlist with full product details:

```typescript
async findByUserId(userId: string): Promise<any> {
  let wishlist = await this.wishlistModel.findOne({ userId }).exec();

  if (!wishlist) {
    // Create a new wishlist if the user doesn't have one
    const newWishlist = await this.create(userId);
    wishlist = await this.wishlistModel.findById(newWishlist._id).exec();
  }

  // Get product details for each product in the wishlist
  const productIds = wishlist.products;
  let products = [];

  if (productIds.length > 0) {
    products = await Promise.all(
      productIds.map(id => this.productService.findOne(id))
    );
    products = products.filter(product => product !== null);
  }

  return {
    _id: wishlist._id,
    userId: wishlist.userId,
    products,
    createdAt: wishlist.createdAt,
    updatedAt: wishlist.updatedAt
  };
}
```

### `create(userId: string)`

Creates a new wishlist for a user:

```typescript
async create(userId: string): Promise<WishlistDocument> {
  const wishlist = new this.wishlistModel({
    userId,
    products: [],
  });
  return wishlist.save();
}
```

### `addItem(userId: string, productId: string)`

Adds a product to the user's wishlist:

```typescript
async addItem(userId: string, productId: string): Promise<WishlistDocument> {
  // Verify that the product exists
  const product = await this.productService.findOne(productId);
  if (!product) {
    throw new NotFoundException(`Product with ID ${productId} not found`);
  }

  // Find user's wishlist or create one
  let wishlist = await this.wishlistModel.findOne({ userId }).exec();
  if (!wishlist) {
    const newWishlist = await this.create(userId);
    wishlist = await this.wishlistModel.findById(newWishlist._id).exec();
  }

  // Add product if it's not already in the wishlist
  if (!wishlist.products.includes(productId)) {
    wishlist.products.push(productId);
    await wishlist.save();
  }

  return wishlist;
}
```

### `removeItem(userId: string, productId: string)`

Removes a product from the user's wishlist:

```typescript
async removeItem(userId: string, productId: string): Promise<WishlistDocument> {
  const wishlist = await this.wishlistModel.findOne({ userId }).exec();

  if (!wishlist) {
    throw new NotFoundException(`Wishlist for user ${userId} not found`);
  }

  wishlist.products = wishlist.products.filter(id => id !== productId);
  return wishlist.save();
}
```

### `clear(userId: string)`

Clears all products from the user's wishlist:

```typescript
async clear(userId: string): Promise<WishlistDocument> {
  const wishlist = await this.wishlistModel.findOne({ userId }).exec();

  if (!wishlist) {
    throw new NotFoundException(`Wishlist for user ${userId} not found`);
  }

  wishlist.products = [];
  return wishlist.save();
}
```

## Controller Implementation

```typescript
@ApiTags('wishlist')
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user wishlist' })
  @ApiResponse({ status: 200, description: 'Returns the user wishlist' })
  getUserWishlist(@Request() req) {
    return this.wishlistService.findByUserId(req.user.id);
  }

  @Post('items/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add product to wishlist' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({
    status: 201,
    description: 'Product added to wishlist successfully',
  })
  addToWishlist(@Request() req, @Param('productId') productId: string) {
    return this.wishlistService.addItem(req.user.id, productId);
  }

  @Delete('items/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove product from wishlist' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Product removed from wishlist successfully',
  })
  removeFromWishlist(@Request() req, @Param('productId') productId: string) {
    return this.wishlistService.removeItem(req.user.id, productId);
  }

  @Delete('clear')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear wishlist' })
  @ApiResponse({
    status: 200,
    description: 'Wishlist cleared successfully',
  })
  clearWishlist(@Request() req) {
    return this.wishlistService.clear(req.user.id);
  }
}
```

## Module Configuration

```typescript
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wishlist.name, schema: WishlistSchema },
    ]),
    ProductModule, // Import ProductModule to use ProductService
  ],
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService],
})
export class WishlistModule {}
```

## Testing

### Unit Testing the Wishlist Service

Example test for the service:

```typescript
describe('WishlistService', () => {
  let service: WishlistService;
  let model: Model<WishlistDocument>;
  let productService: ProductService;

  const mockWishlist = {
    _id: 'wishlist-id',
    userId: 'user-id',
    products: ['product-id1', 'product-id2'],
    save: jest.fn(),
  };

  const mockProduct = {
    id: 'product-id1',
    name: 'Test Product',
    price: 99.99,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        {
          provide: getModelToken(Wishlist.name),
          useValue: {
            findOne: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockWishlist),
            }),
            findById: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockWishlist),
            }),
            new: jest.fn().mockResolvedValue(mockWishlist),
          },
        },
        {
          provide: ProductService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockProduct),
          },
        },
      ],
    }).compile();

    service = module.get<WishlistService>(WishlistService);
    model = module.get<Model<WishlistDocument>>(getModelToken(Wishlist.name));
    productService = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUserId', () => {
    it('should return a wishlist with populated products', async () => {
      const result = await service.findByUserId('user-id');
      expect(result.userId).toEqual('user-id');
      expect(result.products).toBeDefined();
    });
  });

  // Additional tests for addItem, removeItem, clear, etc.
});
```

### End-to-End Testing

Example E2E test for wishlist operations:

```typescript
describe('Wishlist (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  beforeAll(async () => {
    // Setup the app and get a JWT token
  });

  it('/wishlist (GET)', () => {
    return request(app.getHttpServer())
      .get('/wishlist')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.userId).toBeDefined();
        expect(Array.isArray(res.body.products)).toBeTruthy();
      });
  });

  it('/wishlist/items/:productId (POST)', () => {
    return request(app.getHttpServer())
      .post('/wishlist/items/product-id')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(201)
      .expect((res) => {
        expect(res.body.products).toContain('product-id');
      });
  });
});
```

## Common Issues and Troubleshooting

### Issue: Products not showing in wishlist response

**Solution**: Make sure the `productService.findOne()` method is correctly implemented and the product IDs in the wishlist exist in the product database.

### Issue: Duplicate entries in wishlist

**Solution**: The service includes a check to avoid duplicates (`if (!wishlist.products.includes(productId))`). Ensure this logic is working correctly.

### Issue: User can't add products to wishlist

**Solution**: Verify authentication is working correctly and the JWT guard is properly configured.

## Performance Considerations

1. **Indexing**: Ensure the `userId` field in the wishlist collection is indexed for faster lookups
2. **Caching**: Consider caching wishlist data for active users
3. **Pagination**: If wishlists grow large, implement pagination for product retrieval
