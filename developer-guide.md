# Developer Guide: E-commerce Backend

This guide is designed to help developers quickly get started with contributing to the E-commerce backend API project.

## Table of Contents

1. [Setting Up Your Development Environment](#setting-up-your-development-environment)
2. [Project Structure and Organization](#project-structure-and-organization)
3. [Authentication and Authorization](#authentication-and-authorization)
4. [Database Setup and Migrations](#database-setup-and-migrations)
5. [Working with Modules](#working-with-modules)
6. [Testing Guide](#testing-guide)
7. [Contributing Guidelines](#contributing-guidelines)
8. [Common Troubleshooting](#common-troubleshooting)

## Setting Up Your Development Environment

### Prerequisites

Ensure you have the following installed:

- Node.js (v18+)
- npm or yarn
- Git
- PostgreSQL (v14+)
- MongoDB (v6+)
- Redis (v7+)
- VS Code (recommended) with the following extensions:
  - ESLint
  - Prettier
  - NestJS Snippets
  - TypeScript Hero

### Step-by-Step Setup

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

   Edit the `.env` file with your own configuration:

   ```env
   # Application
   NODE_ENV=development
   PORT=3000
   API_PREFIX=api

   # Database - PostgreSQL
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=postgres
   DB_NAME=ecommerce

   # Database - MongoDB
   MONGODB_URI=mongodb://localhost:27017/ecommerce

   # Database - Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # JWT Authentication
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=3600
   JWT_REFRESH_SECRET=your_refresh_token_secret
   JWT_REFRESH_EXPIRES_IN=604800

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Set up the databases**:

   **PostgreSQL**:

   ```bash
   # Create the database
   createdb ecommerce

   # Run migrations
   npm run migration:run
   ```

   **MongoDB**: The application will automatically create collections as needed.

   **Redis**: Make sure Redis server is running:

   ```bash
   redis-server
   ```

5. **Start the application**:

   ```bash
   # Development mode
   npm run start:dev

   # Watch mode with debugging
   npm run start:debug
   ```

6. **Verify your setup**:
   - API is running at: http://localhost:3000/api
   - Swagger documentation: http://localhost:3000/api/docs

## Project Structure and Organization

The project follows a modular architecture with clean separation of concerns:

```
E-commerce/
├── common/                # Shared enums, interfaces, and utilities
├── config/                # Environment configuration
├── core/                  # Core functionality (database connections)
├── lib/                   # Shared libraries, base classes, and decorators
├── modules/               # Feature modules
│   ├── auth/              # Authentication module
│   ├── user/              # User management module
│   └── ...                # Other feature modules
├── migrations/            # Database migration files
├── public/                # Public assets
├── uploads/               # Local file storage
└── src/                   # Application source code
    ├── app.module.ts      # Main application module
    └── main.ts            # Application bootstrap
```

### Important Files

- `src/app.module.ts`: Root module that imports all feature modules
- `src/main.ts`: Application entry point with global configuration
- `config/environments/*.ts`: Environment-specific configuration files
- `core/database/*.module.ts`: Database connection modules
- `modules/*/controller.ts`: API controllers for each feature module
- `modules/*/service.ts`: Business logic implementation for each module
- `modules/*/dto/*.ts`: Data Transfer Objects for request/response validation
- `modules/*/entities/*.ts`: TypeORM entities for PostgreSQL
- `modules/*/schemas/*.ts`: Mongoose schemas for MongoDB

## Authentication and Authorization

### Authentication Flow

1. User registers with email/password
2. User logs in and receives JWT access token and refresh token
3. Access token is included in Authorization header for protected endpoints
4. When access token expires, refresh token is used to get a new access token

### Example: Making Authenticated Requests

```typescript
// Login and get tokens
const loginResponse = await axios.post('/api/auth/login', {
  email: 'user@example.com',
  password: 'password123',
});

const { accessToken } = loginResponse.data;

// Use token for authenticated request
const userProfile = await axios.get('/api/auth/me', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

### Role-Based Access Control

The application uses role-based authorization with the following roles:

- `ADMIN`: Full access to all endpoints
- `CUSTOMER`: Access to own profile and order data
- `SELLER`: Access to product management (custom products)

Roles are implemented using Guards:

```typescript
@Roles(UserRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('admin/dashboard')
getDashboard() {
  // Only accessible to admins
}
```

## Database Setup and Migrations

### Working with TypeORM Migrations

To generate a new migration:

```bash
# Create a migration based on entity changes
npm run migration:generate -- -n CreateUserTable

# Create an empty migration
npm run migration:create -- -n InsertInitialData
```

To run migrations:

```bash
# Run pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert
```

### PostgreSQL vs MongoDB Usage

- **PostgreSQL (TypeORM)**: Used for structured data with relationships
  - Users, Products, Orders, Reviews, etc.
- **MongoDB (Mongoose)**: Used for flexible, schema-less data
  - Cart, Wishlist, Analytics data

### Wishlist Module

The Wishlist module allows users to save products they're interested in for future reference.

#### Key Files

- `modules/wishlist/wishlist.controller.ts` - API endpoints for wishlist operations
- `modules/wishlist/wishlist.service.ts` - Business logic for wishlist manipulation
- `modules/wishlist/schemas/wishlist.schema.ts` - MongoDB schema for wishlist data
- `modules/wishlist/dto/wishlist.dto.ts` - Data transfer objects for wishlist operations

#### Schema Structure

```typescript
@Schema({ timestamps: true })
export class Wishlist {
  _id: string;

  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ type: [String], default: [] })
  products: string[];

  createdAt: Date;
  updatedAt: Date;
}
```

#### API Endpoints

- `GET /api/wishlist` - Get user's wishlist
- `POST /api/wishlist/items/:productId` - Add product to wishlist
- `DELETE /api/wishlist/items/:productId` - Remove product from wishlist
- `DELETE /api/wishlist/clear` - Clear entire wishlist

For detailed documentation, see [Wishlist Module Documentation](docs/wishlist-module.md).

## Working with Modules

### Creating a New Module

1. **Generate the module boilerplate**:

   ```bash
   npx @nestjs/cli g module modules/myfeature
   ```

2. **Generate controller**:

   ```bash
   npx @nestjs/cli g controller modules/myfeature
   ```

3. **Generate service**:

   ```bash
   npx @nestjs/cli g service modules/myfeature
   ```

4. **Create necessary folders**:
   - `dto/`: For Data Transfer Objects
   - `entities/` or `schemas/`: For database models
   - `interfaces/`: For TypeScript interfaces

5. **Add module to app.module.ts** if not automatically added

### Module Development Best Practices

1. **Use DTOs for validation**:

   ```typescript
   export class CreateProductDto {
     @IsNotEmpty()
     @IsString()
     name: string;

     @IsNumber()
     @Min(0)
     price: number;
   }
   ```

2. **Implement proper error handling**:

   ```typescript
   async findById(id: string): Promise<Product> {
     const product = await this.productRepository.findOne({ where: { id } });
     if (!product) {
       throw new NotFoundException(`Product with ID "${id}" not found`);
     }
     return product;
   }
   ```

3. **Document with Swagger**:
   ```typescript
   @ApiTags('products')
   @ApiOperation({ summary: 'Create a new product' })
   @ApiResponse({
     status: HttpStatus.CREATED,
     description: 'Product created successfully',
     type: ProductDto,
   })
   @Post()
   create(@Body() createProductDto: CreateProductDto) {
     return this.productService.create(createProductDto);
   }
   ```

## Testing Guide

### Unit Testing

Write unit tests for service methods:

```typescript
describe('ProductService', () => {
  let service: ProductService;
  let repository: MockType<Repository<Product>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useFactory: repositoryMockFactory,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    repository = module.get(getRepositoryToken(Product));
  });

  it('should find a product by id', async () => {
    const product = { id: '1', name: 'Test Product', price: 100 };
    repository.findOne.mockReturnValue(product);

    expect(await service.findById('1')).toEqual(product);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
  });
});
```

To run tests:

```bash
# Run all unit tests
npm run test

# Run with coverage
npm run test:cov

# Run specific test file
npm run test -- src/modules/product/product.service.spec.ts
```

### E2E Testing

Write end-to-end tests for API endpoints:

```typescript
describe('Products API (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login to get authentication token
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'admin123',
      });

    token = response.body.accessToken;
  });

  it('/api/products (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/products')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body.items)).toBe(true);
      });
  });

  it('/api/products (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Product',
        price: 99.99,
        description: 'A test product',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.name).toEqual('Test Product');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

To run E2E tests:

```bash
npm run test:e2e
```

## Contributing Guidelines

### Git Workflow

1. **Create a feature branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes and commit**:

   ```bash
   git add .
   git commit -m "feat: add new payment gateway integration"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/) format:
   - `feat`: A new feature
   - `fix`: A bug fix
   - `docs`: Documentation changes
   - `style`: Code style changes (formatting, etc.)
   - `refactor`: Code refactoring without changing functionality
   - `test`: Adding or updating tests
   - `chore`: Updating build tasks, package manager configs, etc.

3. **Push your branch**:

   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a pull request** describing your changes

### Code Style

- Follow the ESLint and Prettier configuration
- Run linting before committing:
  ```bash
  npm run lint
  ```

### Code Review Process

- All pull requests require at least one reviewer
- All tests must pass before merging
- CI/CD pipeline must succeed

## Common Troubleshooting

### Database Connection Issues

**Problem**: Cannot connect to PostgreSQL
**Solution**:

- Check if PostgreSQL service is running:
  ```bash
  pg_isready
  ```
- Verify database credentials in `.env` file
- Ensure database exists:
  ```bash
  psql -U postgres -c "SELECT datname FROM pg_database"
  ```

**Problem**: MongoDB connection error
**Solution**:

- Verify MongoDB is running:
  ```bash
  mongo --eval "db.adminCommand('ping')"
  ```
- Check connection string in `.env`

### Authentication Issues

**Problem**: JWT invalid signature
**Solution**:

- Ensure JWT_SECRET in `.env` matches the token issuer
- Check token expiration (default: 1 hour)
- Use refresh token endpoint to get a new access token

### Other Common Issues

**Problem**: "Cannot find module" errors
**Solution**:

- Check that all dependencies are installed:
  ```bash
  npm install
  ```
- Rebuild the project:
  ```bash
  npm run build
  ```

**Problem**: TypeORM entity is not registered
**Solution**:

- Ensure entity is included in the TypeORM module:
  ```typescript
  TypeOrmModule.forFeature([User, Product, ...])
  ```
- Check entity paths in `ormconfig.js`

**Problem**: Missing environment variables
**Solution**:

- Copy and complete `.env.example` to `.env`
- Restart application after changing env vars

---

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [JWT Authentication](https://jwt.io/introduction)
- [Our API Reference Guide](./api-endpoint-reference.md)
- [Architecture Documentation](./architecture.md)

For any questions or issues not covered here, please contact the development team or create an issue on GitHub.
