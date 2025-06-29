import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Product, ProductStatus } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductVariantDto } from './dto/create-variant.dto';
import {
  ProductVariant,
  ProductVariantDocument,
} from './schemas/product-variant.schema';
import { Category, CategoryDocument } from './schemas/category.schema';
import { PageDto } from '../../lib/dto/page.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectModel(ProductVariant.name)
    private variantModel: Model<ProductVariantDocument>,
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
    private configService: ConfigService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  async findAll(
    page = 1,
    limit = 10,
    status?: ProductStatus,
    category?: string,
    search?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<PageDto<Product>> {
    const skip = (page - 1) * limit;

    // Build query
    const queryBuilder = this.productRepository.createQueryBuilder('product');

    // Apply filters
    if (status) {
      queryBuilder.andWhere('product.status = :status', { status });
    }

    if (category) {
      queryBuilder.andWhere('product.categories @> ARRAY[:category]', {
        category,
      });
    }

    if (search) {
      queryBuilder.andWhere('product.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    // Apply sorting
    queryBuilder.orderBy(`product.${sortBy}`, sortOrder);

    // Get total count for pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Get products
    const products = await queryBuilder.getMany();

    const result = new PageDto<Product>();
    result.data = products;
    result.total = total;
    result.page = page;
    result.limit = limit;
    result.totalPages = Math.ceil(total / limit);
    result.hasNextPage = page < Math.ceil(total / limit);
    result.hasPreviousPage = page > 1;

    return result;
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);

    // Merge and save
    this.productRepository.merge(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const result = await this.productRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Remove associated variants
    await this.variantModel.deleteMany({ productId: id });
  }

  async findFeaturedProducts(limit: number = 10): Promise<Product[]> {
    return this.productRepository.find({
      where: { featured: true, status: ProductStatus.ACTIVE },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByCategory(
    categoryId: string,
    limit: number = 10,
  ): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .where('product.categories @> ARRAY[:categoryId]', { categoryId })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
      .orderBy('product.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async searchProducts(query: string, limit: number = 10): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .where('product.name ILIKE :query OR product.description ILIKE :query', {
        query: `%${query}%`,
      })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
      .orderBy('product.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  // Variant related methods
  async addVariant(
    createVariantDto: CreateProductVariantDto,
  ): Promise<ProductVariant> {
    // Ensure product exists
    await this.findOne(createVariantDto.productId);

    // Create and save variant
    const variant = new this.variantModel(createVariantDto);
    return variant.save();
  }

  async findAllVariants(productId: string): Promise<ProductVariant[]> {
    return this.variantModel.find({ productId }).exec();
  }

  async findVariant(id: string): Promise<ProductVariant> {
    const variant = await this.variantModel.findById(id).exec();

    if (!variant) {
      throw new NotFoundException(`Variant with ID ${id} not found`);
    }

    return variant;
  }

  async updateVariant(
    id: string,
    updateData: Partial<CreateProductVariantDto>,
  ): Promise<ProductVariant> {
    const variant = await this.variantModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!variant) {
      throw new NotFoundException(`Variant with ID ${id} not found`);
    }

    return variant;
  }

  async removeVariant(id: string): Promise<void> {
    const result = await this.variantModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Variant with ID ${id} not found`);
    }
  }

  // Category related methods
  async createCategory(data: {
    name: string;
    description?: string;
    image?: string;
    parentId?: string;
  }): Promise<Category> {
    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if parent category exists if parentId is provided
    if (data.parentId) {
      const parentExists = await this.categoryModel
        .findById(data.parentId)
        .exec();
      if (!parentExists) {
        throw new BadRequestException(
          `Parent category with ID ${data.parentId} not found`,
        );
      }
    }

    // Create and save category
    const category = new this.categoryModel({
      ...data,
      slug,
    });

    return category.save();
  }

  async findAllCategories(parentId?: string): Promise<Category[]> {
    const query = parentId ? { parentId } : {};
    return this.categoryModel.find(query).exec();
  }

  async findCategory(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).exec();

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async findCategoryBySlug(slug: string): Promise<Category> {
    const category = await this.categoryModel.findOne({ slug }).exec();

    if (!category) {
      throw new NotFoundException(`Category with slug ${slug} not found`);
    }

    return category;
  }

  async updateCategory(
    id: string,
    updateData: Partial<Category>,
  ): Promise<Category> {
    // Update slug if name is changed
    if (updateData.name) {
      updateData.slug = updateData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const category = await this.categoryModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async removeCategory(id: string): Promise<void> {
    // Check if there are any subcategories
    const hasChildren = await this.categoryModel
      .findOne({ parentId: id })
      .exec();

    if (hasChildren) {
      throw new BadRequestException(
        `Cannot delete category with ID ${id} because it has subcategories`,
      );
    }

    // Check if there are any products using this category
    const hasProducts = await this.productRepository
      .createQueryBuilder('product')
      .where('product.categories @> ARRAY[:categoryId]', { categoryId: id })
      .getCount();

    if (hasProducts > 0) {
      throw new BadRequestException(
        `Cannot delete category with ID ${id} because it is used by ${hasProducts} products`,
      );
    }

    const result = await this.categoryModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }
}
