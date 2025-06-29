import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { Order, OrderItem } from './entities/order.entity';
import { CreateOrderDto, UpdateOrderDto, OrderItemDto } from './dto/order.dto';
import { CartService } from '../cart/cart.service';
import { ProductService } from '../product/product.service';
import { OrderStatus } from '../../common/enums/order-status.enum';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private cartService: CartService,
    private productService: ProductService,
    private configService: ConfigService,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    // Generate unique order number
    const orderNumber = this.generateOrderNumber();

    // Format addresses
    const shippingAddress = this.formatAddress(createOrderDto.shippingAddress);
    const billingAddress = createOrderDto.sameAsShipping
      ? shippingAddress
      : this.formatAddress(createOrderDto.billingAddress);

    // Calculate order totals
    const { subtotal, tax, shipping, total } = await this.calculateOrderTotals(
      createOrderDto.items,
      createOrderDto.couponCode,
    );

    // Create the order
    const order = this.orderRepository.create({
      userId,
      orderNumber,
      subtotal,
      tax,
      shipping,
      total,
      discount: 0, // Will be updated if coupon is applied
      couponCode: createOrderDto.couponCode,
      shippingAddress,
      billingAddress,
      paymentMethod: createOrderDto.paymentMethod,
      status: OrderStatus.PENDING,
      metadata: {
        notes: createOrderDto.notes,
        createdAt: new Date(),
      },
    });

    // Save the order to get the ID
    const savedOrder = await this.orderRepository.save(order);

    // Create order items
    const orderItems = createOrderDto.items.map((item) =>
      this.orderItemRepository.create({
        orderId: savedOrder.id,
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        attributes: item.attributes,
      }),
    );

    // Save order items
    await this.orderItemRepository.save(orderItems);

    // Clear the user's cart
    await this.cartService.clear(userId);

    // Update product stock
    await this.updateProductStock(createOrderDto.items);

    // Return the saved order with its items
    return this.findOne(savedOrder.id);
  }

  private generateOrderNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `ORD-${dateStr}-${random}`;
  }

  private formatAddress(address: any): string {
    if (!address) return null;

    return JSON.stringify({
      fullName: address.fullName,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone,
    });
  }

  private async calculateOrderTotals(
    items: OrderItemDto[],
    couponCode?: string,
  ): Promise<{
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  }> {
    // Calculate subtotal
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Calculate tax based on config
    const taxRate = this.configService.get('app.taxRate') || 0.1; // Default 10%
    const tax = subtotal * taxRate;

    // Calculate shipping (could be more complex based on location, weight, etc.)
    const freeShippingThreshold =
      this.configService.get('app.freeShippingThreshold') || 100;
    const baseShippingRate =
      this.configService.get('app.baseShippingRate') || 10;

    const shipping = subtotal >= freeShippingThreshold ? 0 : baseShippingRate;

    // Calculate total
    const total = subtotal + tax + shipping;

    return { subtotal, tax, shipping, total };
  }

  private async updateProductStock(items: OrderItemDto[]): Promise<void> {
    for (const item of items) {
      if (item.variantId) {
        // Update variant stock if variant exists
        const variant = await this.productService.findVariant(item.variantId);

        if (variant && variant.quantity >= item.quantity) {
          await this.productService.updateVariant(item.variantId, {
            quantity: variant.quantity - item.quantity,
          });
        }
      } else {
        // Update product stock
        const product = await this.productService.findOne(item.productId);

        if (product && product.quantity >= item.quantity) {
          await this.productService.update(item.productId, {
            quantity: product.quantity - item.quantity,
          });
        }
      }
    }
  }

  async findAll(userId?: string): Promise<Order[]> {
    const query = userId ? { where: { userId } } : {};
    return this.orderRepository.find({
      ...query,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Get order items
    const items = await this.orderItemRepository.find({
      where: { orderId: id },
    });

    // Add items and calculated properties to the order object
    const result = {
      ...order,
      items,
      // Add the totalAmount property that's needed by payment service
      totalAmount: order.total,
    };
    return result;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
    });

    if (!order) {
      throw new NotFoundException(`Order with number ${orderNumber} not found`);
    }

    // Get order items
    const items = await this.orderItemRepository.find({
      where: { orderId: order.id },
    });

    // Add items and calculated properties to the order object
    const result = {
      ...order,
      items,
      // Add the totalAmount property that's needed by payment service
      totalAmount: order.total,
    };
    return result;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    // Update order fields
    if (updateOrderDto.status) {
      order.status = updateOrderDto.status;

      // Update status-related dates
      if (updateOrderDto.status === OrderStatus.PAID) {
        order.isPaid = true;
        order.paidAt = new Date();
      } else if (updateOrderDto.status === OrderStatus.SHIPPED) {
        order.shippedAt = new Date();
      } else if (updateOrderDto.status === OrderStatus.DELIVERED) {
        order.deliveredAt = new Date();
      } else if (updateOrderDto.status === OrderStatus.CANCELLED) {
        order.cancelledAt = new Date();
        order.cancelReason =
          updateOrderDto.cancelReason || 'No reason provided';
      }
    }

    if (updateOrderDto.paymentId) {
      order.paymentId = updateOrderDto.paymentId;
    }

    if (updateOrderDto.isPaid !== undefined) {
      order.isPaid = updateOrderDto.isPaid;
      if (updateOrderDto.isPaid) {
        order.paidAt = updateOrderDto.paidAt || new Date();
      }
    }

    // Apply other updates if provided
    if (updateOrderDto.shippedAt) order.shippedAt = updateOrderDto.shippedAt;
    if (updateOrderDto.deliveredAt)
      order.deliveredAt = updateOrderDto.deliveredAt;
    if (updateOrderDto.cancelledAt)
      order.cancelledAt = updateOrderDto.cancelledAt;
    if (updateOrderDto.cancelReason)
      order.cancelReason = updateOrderDto.cancelReason;

    // Save and return updated order
    await this.orderRepository.save(order);
    return this.findOne(id);
  }

  async cancelOrder(id: string, reason: string): Promise<Order> {
    const order = await this.findOne(id);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    // Update order status
    return this.update(id, {
      status: OrderStatus.CANCELLED,
      cancelReason: reason,
      cancelledAt: new Date(),
    });
  }

  async getOrderStatistics(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
  }> {
    const totalOrders = await this.orderRepository.count();

    const pendingOrders = await this.orderRepository.count({
      where: { status: OrderStatus.PENDING },
    });

    const completedOrders = await this.orderRepository.count({
      where: { status: OrderStatus.DELIVERED },
    });

    const cancelledOrders = await this.orderRepository.count({
      where: { status: OrderStatus.CANCELLED },
    });

    // Calculate total revenue from completed orders
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'totalRevenue')
      .where('order.status = :status', { status: OrderStatus.DELIVERED })
      .getRawOne();

    const totalRevenue = result.totalRevenue
      ? parseFloat(result.totalRevenue)
      : 0;

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
    };
  }

  async findOrderItems(orderId: string): Promise<OrderItem[]> {
    return this.orderItemRepository.find({
      where: { orderId },
    });
  }

  // Method to update payment status
  async updatePaymentStatus(orderId: string, isPaid: boolean): Promise<Order> {
    const order = await this.orderRepository.findOneBy({ id: orderId });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Update status based on payment
    if (isPaid) {
      order.status = OrderStatus.PROCESSING;
    } else {
      order.status = OrderStatus.PAYMENT_FAILED;
    }

    return this.orderRepository.save(order);
  }

  // Method to update order status directly
  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    const order = await this.orderRepository.findOneBy({ id: orderId });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Convert string status to OrderStatus enum if needed
    let orderStatus: OrderStatus;

    if (Object.values(OrderStatus).includes(status as OrderStatus)) {
      orderStatus = status as OrderStatus;
    } else {
      // Handle string status values from payment processors
      switch (status) {
        case 'PAID':
          orderStatus = OrderStatus.PAID;
          break;
        case 'SHIPPED':
          orderStatus = OrderStatus.SHIPPED;
          break;
        case 'DELIVERED':
          orderStatus = OrderStatus.DELIVERED;
          break;
        case 'CANCELLED':
          orderStatus = OrderStatus.CANCELLED;
          break;
        case 'REFUNDED':
          orderStatus = OrderStatus.REFUNDED;
          break;
        default:
          orderStatus = OrderStatus.PROCESSING;
      }
    }

    // Update the order status
    order.status = orderStatus;

    // Update related timestamps
    if (orderStatus === OrderStatus.PAID) {
      order.isPaid = true;
      order.paidAt = new Date();
    } else if (orderStatus === OrderStatus.SHIPPED) {
      order.shippedAt = new Date();
    } else if (orderStatus === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
    } else if (orderStatus === OrderStatus.CANCELLED) {
      order.cancelledAt = new Date();
    } else if (orderStatus === OrderStatus.REFUNDED) {
      order.isPaid = false;
    }

    return this.orderRepository.save(order);
  }
}
