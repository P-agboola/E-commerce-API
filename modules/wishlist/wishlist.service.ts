import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wishlist, WishlistDocument } from './schemas/wishlist.schema';
import { ProductService } from '../product/product.service';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name) private wishlistModel: Model<WishlistDocument>,
    private readonly productService: ProductService,
  ) {}

  async findByUserId(userId: string): Promise<any> {
    let wishlist = await this.wishlistModel.findOne({ userId }).exec();

    if (!wishlist) {
      // Create a new wishlist if the user doesn't have one
      const newWishlist = await this.create(userId);
      wishlist = await this.wishlistModel.findById(newWishlist._id).exec();
      if (!wishlist) {
        throw new NotFoundException('Failed to create wishlist');
      }
    }

    // Get product details for each product in the wishlist
    const productIds = wishlist.products;
    let products = [];

    if (productIds.length > 0) {
      // Get products one by one since there's no findByIds method
      products = await Promise.all(
        productIds.map((id) => this.productService.findOne(id)),
      );
      // Filter out any null values (in case a product was deleted)
      products = products.filter((product) => product !== null);
    }

    return {
      _id: wishlist._id,
      userId: wishlist.userId,
      products,
      createdAt: wishlist.createdAt,
      updatedAt: wishlist.updatedAt,
    };
  }

  async create(userId: string): Promise<WishlistDocument> {
    const wishlist = new this.wishlistModel({
      userId,
      products: [],
    });
    return wishlist.save();
  }

  async addItem(userId: string, productId: string): Promise<WishlistDocument> {
    // Verify that the product exists
    const product = await this.productService.findOne(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Find user's wishlist or create one
    let wishlist = await this.wishlistModel.findOne({ userId }).exec();
    if (!wishlist) {
      // Create a new wishlist
      const newWishlist = await this.create(userId);
      wishlist = await this.wishlistModel.findById(newWishlist._id).exec();
      if (!wishlist) {
        throw new NotFoundException('Failed to create wishlist');
      }
    }

    // Add product if it's not already in the wishlist
    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    return wishlist;
  }

  async removeItem(
    userId: string,
    productId: string,
  ): Promise<WishlistDocument> {
    const wishlist = await this.wishlistModel.findOne({ userId }).exec();

    if (!wishlist) {
      throw new NotFoundException(`Wishlist for user ${userId} not found`);
    }

    wishlist.products = wishlist.products.filter((id) => id !== productId);
    return wishlist.save();
  }

  async clear(userId: string): Promise<WishlistDocument> {
    const wishlist = await this.wishlistModel.findOne({ userId }).exec();

    if (!wishlist) {
      throw new NotFoundException(`Wishlist for user ${userId} not found`);
    }

    wishlist.products = [];
    return wishlist.save();
  }
}
