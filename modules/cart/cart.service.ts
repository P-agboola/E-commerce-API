import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart, CartDocument } from './schemas/cart.schema';
import {
  AddToCartItemDto,
  UpdateCartItemDto,
  CreateCartDto,
} from './dto/cart.dto';
import { Product } from '../product/entities/product.entity';
import { ProductService } from '../product/product.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private productService: ProductService,
    private configService: ConfigService,
  ) {}

  async create(createCartDto: CreateCartDto): Promise<Cart> {
    const cart = new this.cartModel(createCartDto);
    return cart.save();
  }

  async findByUserId(userId: string): Promise<Cart> {
    const cart = await this.cartModel
      .findOne({ userId, isActive: true })
      .exec();

    if (!cart) {
      // Create new cart if not found
      return this.create({ userId, items: [] });
    }

    return cart;
  }

  async findBySessionId(sessionId: string): Promise<Cart> {
    const cart = await this.cartModel
      .findOne({ sessionId, isActive: true })
      .exec();

    if (!cart) {
      // Create a temporary userId for guest cart
      const tempUserId = uuidv4();
      return this.create({ userId: tempUserId, sessionId, items: [] });
    }

    return cart;
  }

  async addItem(userId: string, item: AddToCartItemDto): Promise<Cart> {
    // Validate product exists and is in stock
    const product = await this.productService.findOne(item.productId);

    if (product.quantity <= 0) {
      throw new BadRequestException('Product is out of stock');
    }

    // Find user's active cart or create new one
    const cart = await this.findByUserId(userId);

    // Check if product is already in cart
    const existingItemIndex = cart.items.findIndex(
      (i) =>
        i.productId === item.productId &&
        ((!i.variantId && !item.variantId) || i.variantId === item.variantId),
    );

    if (existingItemIndex > -1) {
      // Update quantity if item already in cart
      cart.items[existingItemIndex].quantity += item.quantity || 1;
    } else {
      // Add new item to cart
      cart.items.push({
        productId: item.productId,
        variantId: item.variantId,
        name: product.name,
        image: product.images?.[0] || null,
        price: item.variantId
          ? await this.getVariantPrice(item.variantId)
          : product.price,
        quantity: item.quantity || 1,
        attributes: item.attributes || {},
      });
    }

    return this.cartModel
      .findByIdAndUpdate(cart._id, cart, { new: true })
      .exec();
  }

  private async getVariantPrice(variantId: string): Promise<number> {
    const variant = await this.productService.findVariant(variantId);
    return variant.price;
  }

  async updateItemQuantity(
    userId: string,
    updateData: UpdateCartItemDto,
  ): Promise<Cart> {
    const cart = await this.findByUserId(userId);

    const itemIndex = cart.items.findIndex(
      (item, index) => index.toString() === updateData.itemId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException(`Item not found in cart`);
    }

    if (updateData.quantity <= 0) {
      // Remove item from cart if quantity is 0 or less
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = updateData.quantity;
    }

    return this.cartModel
      .findByIdAndUpdate(cart._id, cart, { new: true })
      .exec();
  }

  async removeItem(userId: string, itemIndex: number): Promise<Cart> {
    const cart = await this.findByUserId(userId);

    if (itemIndex < 0 || itemIndex >= cart.items.length) {
      throw new NotFoundException('Item not found in cart');
    }

    cart.items.splice(itemIndex, 1);

    return this.cartModel
      .findByIdAndUpdate(cart._id, cart, { new: true })
      .exec();
  }

  async clear(userId: string): Promise<Cart> {
    const cart = await this.findByUserId(userId);
    cart.items = [];

    return this.cartModel
      .findByIdAndUpdate(cart._id, cart, { new: true })
      .exec();
  }

  async mergeGuestCart(sessionId: string, userId: string): Promise<Cart> {
    const guestCart = await this.cartModel
      .findOne({ sessionId, isActive: true })
      .exec();

    if (!guestCart) {
      return this.findByUserId(userId);
    }

    const userCart = await this.findByUserId(userId);

    // Merge items from guest cart into user cart
    for (const item of guestCart.items) {
      const existingItemIndex = userCart.items.findIndex(
        (i) =>
          i.productId === item.productId &&
          ((!i.variantId && !item.variantId) || i.variantId === item.variantId),
      );

      if (existingItemIndex > -1) {
        userCart.items[existingItemIndex].quantity += item.quantity;
      } else {
        userCart.items.push(item);
      }
    }

    // Save updated user cart
    await this.cartModel.findByIdAndUpdate(userCart._id, userCart).exec();

    // Delete guest cart
    await this.cartModel.findByIdAndDelete(guestCart._id).exec();

    return this.findByUserId(userId);
  }

  async calculateTotals(cart: Cart): Promise<{
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  }> {
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Calculate tax based on config
    const taxRate = this.configService.get('app.taxRate') || 0;
    const tax = subtotal * taxRate;

    // Calculate shipping (could be more complex based on location, weight, etc.)
    const freeShippingThreshold =
      this.configService.get('app.freeShippingThreshold') || 0;
    const baseShippingRate =
      this.configService.get('app.baseShippingRate') || 0;

    const shipping = subtotal >= freeShippingThreshold ? 0 : baseShippingRate;

    // Calculate total
    const total = subtotal + tax + shipping;

    return { subtotal, tax, shipping, total };
  }
}
