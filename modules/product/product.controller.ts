import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ProductService } from './product.service';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductVariantDto } from './dto/create-variant.dto';
import { ProductVariant } from './schemas/product-variant.schema';
import { Category } from './schemas/category.schema';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The product has been successfully created.',
    type: Product,
  })
  create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all products',
  })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: any,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    return this.productService.findAll(
      page,
      limit,
      status,
      category,
      search,
      sortBy,
      sortOrder,
    );
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return featured products',
    type: [Product],
  })
  findFeatured(@Query('limit') limit?: number) {
    return this.productService.findFeaturedProducts(limit);
  }

  @Get('category/:id')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return products by category',
    type: [Product],
  })
  findByCategory(
    @Param('id') categoryId: string,
    @Query('limit') limit?: number,
  ) {
    return this.productService.findByCategory(categoryId, limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return search results',
    type: [Product],
  })
  search(@Query('q') query: string, @Query('limit') limit?: number) {
    return this.productService.searchProducts(query, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the product',
    type: Product,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Product not found',
  })
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product has been successfully updated',
    type: Product,
  })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Product has been successfully deleted',
  })
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  // Product variants endpoints
  @Post('variants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a product variant' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Variant has been successfully created',
    type: ProductVariant,
  })
  addVariant(@Body() createVariantDto: CreateProductVariantDto) {
    return this.productService.addVariant(createVariantDto);
  }

  @Get(':id/variants')
  @ApiOperation({ summary: 'Get all variants for a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all product variants',
    type: [ProductVariant],
  })
  findAllVariants(@Param('id') productId: string) {
    return this.productService.findAllVariants(productId);
  }

  @Patch('variants/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product variant' })
  @ApiParam({ name: 'id', description: 'Variant ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Variant has been successfully updated',
    type: ProductVariant,
  })
  updateVariant(
    @Param('id') id: string,
    @Body() updateVariantDto: Partial<CreateProductVariantDto>,
  ) {
    return this.productService.updateVariant(id, updateVariantDto);
  }

  @Delete('variants/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'seller')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product variant' })
  @ApiParam({ name: 'id', description: 'Variant ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Variant has been successfully deleted',
  })
  removeVariant(@Param('id') id: string) {
    return this.productService.removeVariant(id);
  }

  // Categories endpoints
  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a category' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Category has been successfully created',
    type: Category,
  })
  createCategory(
    @Body()
    data: {
      name: string;
      description?: string;
      image?: string;
      parentId?: string;
    },
  ) {
    return this.productService.createCategory(data);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  @ApiQuery({
    name: 'parentId',
    required: false,
    description: 'Parent category ID to filter by',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all categories',
    type: [Category],
  })
  findAllCategories(@Query('parentId') parentId?: string) {
    return this.productService.findAllCategories(parentId);
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get a category by id' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the category',
    type: Category,
  })
  findCategory(@Param('id') id: string) {
    return this.productService.findCategory(id);
  }

  @Get('categories/slug/:slug')
  @ApiOperation({ summary: 'Get a category by slug' })
  @ApiParam({ name: 'slug', description: 'Category slug' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the category',
    type: Category,
  })
  findCategoryBySlug(@Param('slug') slug: string) {
    return this.productService.findCategoryBySlug(slug);
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category has been successfully updated',
    type: Category,
  })
  updateCategory(
    @Param('id') id: string,
    @Body() updateData: Partial<Category>,
  ) {
    return this.productService.updateCategory(id, updateData);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Category has been successfully deleted',
  })
  removeCategory(@Param('id') id: string) {
    return this.productService.removeCategory(id);
  }
}
