import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaymentEntity,
  PaymentProvider,
  PaymentStatus,
} from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { StripePaymentStrategy } from './strategies/stripe-payment.strategy';
import { PaypalPaymentStrategy } from './strategies/paypal-payment.strategy';
import { PaymentStrategy } from './strategies/payment-strategy.interface';
import { OrderService } from '../order/order.service';

@Injectable()
export class PaymentService {
  private paymentStrategies: Map<PaymentProvider, PaymentStrategy>;

  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    private readonly orderService: OrderService,
    private readonly stripeStrategy: StripePaymentStrategy,
    private readonly paypalStrategy: PaypalPaymentStrategy,
  ) {
    this.paymentStrategies = new Map();
    this.paymentStrategies.set(PaymentProvider.STRIPE, stripeStrategy);
    this.paymentStrategies.set(PaymentProvider.PAYPAL, paypalStrategy);
  }

  async create(createPaymentDto: CreatePaymentDto): Promise<PaymentEntity> {
    // Verify the order exists and payment amount matches
    const order = await this.orderService.findOne(createPaymentDto.orderId);
    if (!order) {
      throw new NotFoundException(
        `Order not found with ID: ${createPaymentDto.orderId}`,
      );
    }

    // Verify payment amount matches order total
    if (order.totalAmount !== createPaymentDto.amount) {
      throw new BadRequestException(
        `Payment amount (${createPaymentDto.amount}) does not match order total (${order.totalAmount})`,
      );
    }

    // Get the appropriate payment strategy
    const paymentStrategy = this.paymentStrategies.get(
      createPaymentDto.provider,
    );
    if (!paymentStrategy) {
      throw new BadRequestException(
        `Unsupported payment provider: ${createPaymentDto.provider}`,
      );
    }

    // Create a payment record in pending state
    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      status: PaymentStatus.PENDING,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Process payment with the selected provider
    const paymentResult = await paymentStrategy.createPayment(
      createPaymentDto.amount,
      {
        orderId: createPaymentDto.orderId,
        paymentId: savedPayment.id,
        ...(createPaymentDto.paymentDetails || {}),
      },
    );

    // Update payment with provider response
    savedPayment.status = paymentResult.status;
    savedPayment.transactionId = paymentResult.transactionId;
    savedPayment.paymentIntentId = paymentResult.paymentIntentId;
    savedPayment.paymentDetails = {
      ...(savedPayment.paymentDetails || {}),
      ...(paymentResult.details || {}),
    };
    savedPayment.errorMessage = paymentResult.errorMessage;

    return this.paymentRepository.save(savedPayment);
  }

  async finalizePayment(id: string, paymentData: any): Promise<PaymentEntity> {
    const payment = await this.findOne(id);

    // Get the appropriate payment strategy
    const paymentStrategy = this.paymentStrategies.get(payment.provider);
    if (!paymentStrategy) {
      throw new BadRequestException(
        `Unsupported payment provider: ${payment.provider}`,
      );
    }

    // Process the payment
    const paymentResult = await paymentStrategy.processPayment({
      ...paymentData,
      paymentIntentId: payment.paymentIntentId,
    });

    // Update payment record with result
    payment.status = paymentResult.status;
    payment.transactionId =
      paymentResult.transactionId || payment.transactionId;
    payment.paymentDetails = {
      ...(payment.paymentDetails || {}),
      ...(paymentResult.details || {}),
    };
    payment.errorMessage = paymentResult.errorMessage;

    const updatedPayment = await this.paymentRepository.save(payment);

    // If payment successful, update order status
    if (
      paymentResult.success &&
      paymentResult.status === PaymentStatus.SUCCEEDED
    ) {
      await this.orderService.updatePaymentStatus(payment.orderId, true);
    }

    return updatedPayment;
  }

  async refundPayment(id: string, amount?: number): Promise<PaymentEntity> {
    const payment = await this.findOne(id);

    // Check if payment can be refunded
    if (payment.status !== PaymentStatus.SUCCEEDED) {
      throw new BadRequestException('Only successful payments can be refunded');
    }

    // Get the appropriate payment strategy
    const paymentStrategy = this.paymentStrategies.get(payment.provider);
    if (!paymentStrategy) {
      throw new BadRequestException(
        `Unsupported payment provider: ${payment.provider}`,
      );
    }

    // Process the refund
    const refundResult = await paymentStrategy.refundPayment(
      payment.transactionId || payment.paymentIntentId,
      amount,
    );

    // Update payment record with result
    payment.status = refundResult.status;
    payment.paymentDetails = {
      ...(payment.paymentDetails || {}),
      refund: refundResult.details || {},
    };

    const updatedPayment = await this.paymentRepository.save(payment);

    // Update order status for full refunds
    if (
      refundResult.success &&
      refundResult.status === PaymentStatus.REFUNDED
    ) {
      await this.orderService.updatePaymentStatus(payment.orderId, false);
    }

    return updatedPayment;
  }

  async processWebhook(
    provider: PaymentProvider,
    payload: any,
    signature: string,
  ): Promise<{ success: boolean; message: string }> {
    // Get the appropriate payment strategy
    const paymentStrategy = this.paymentStrategies.get(provider);
    if (!paymentStrategy) {
      throw new BadRequestException(
        `Unsupported payment provider: ${provider}`,
      );
    }

    // Verify webhook signature
    const isValid = await paymentStrategy.verifyWebhook(payload, signature);
    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    try {
      // Process webhook based on event type
      if (provider === PaymentProvider.STRIPE) {
        return await this.processStripeWebhook(payload);
      } else if (provider === PaymentProvider.PAYPAL) {
        return await this.processPayPalWebhook(payload);
      } else {
        throw new BadRequestException(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      throw new BadRequestException(
        `Error processing webhook: ${error.message}`,
      );
    }
  }

  private async processStripeWebhook(
    payload: any,
  ): Promise<{ success: boolean; message: string }> {
    const event = payload;
    const eventType = event.type;

    switch (eventType) {
      case 'payment_intent.succeeded':
        await this.handleStripePaymentSucceeded(event.data.object);
        return { success: true, message: 'Payment succeeded event processed' };

      case 'payment_intent.payment_failed':
        await this.handleStripePaymentFailed(event.data.object);
        return { success: true, message: 'Payment failed event processed' };

      case 'charge.refunded':
        await this.handleStripeRefund(event.data.object);
        return { success: true, message: 'Refund event processed' };

      default:
        // Log unhandled events but return success to avoid retry
        console.log(`Unhandled Stripe event: ${eventType}`);
        return { success: true, message: `Unhandled event type: ${eventType}` };
    }
  }

  private async processPayPalWebhook(
    payload: any,
  ): Promise<{ success: boolean; message: string }> {
    const event = payload;
    const eventType = event.event_type;

    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await this.handlePayPalPaymentCompleted(event.resource);
        return { success: true, message: 'Payment completed event processed' };

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED':
        await this.handlePayPalPaymentFailed(event.resource);
        return { success: true, message: 'Payment failed event processed' };

      case 'PAYMENT.CAPTURE.REFUNDED':
        await this.handlePayPalRefund(event.resource);
        return { success: true, message: 'Refund event processed' };

      default:
        // Log unhandled events but return success to avoid retry
        console.log(`Unhandled PayPal event: ${eventType}`);
        return { success: true, message: `Unhandled event type: ${eventType}` };
    }
  }

  private async handleStripePaymentSucceeded(
    paymentIntent: any,
  ): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { paymentIntentId: paymentIntent.id },
    });

    if (!payment) {
      console.log(`Payment not found for intent ID: ${paymentIntent.id}`);
      return;
    }

    // Update payment record
    payment.status = PaymentStatus.SUCCEEDED;
    payment.transactionId =
      paymentIntent.charges?.data?.[0]?.id ?? payment.transactionId;

    await this.paymentRepository.save(payment);

    // Update order status
    await this.orderService.updateOrderStatus(payment.orderId, 'PAID');
  }

  private async handleStripePaymentFailed(paymentIntent: any): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { paymentIntentId: paymentIntent.id },
    });

    if (!payment) {
      console.log(`Payment not found for intent ID: ${paymentIntent.id}`);
      return;
    }

    // Update payment record
    payment.status = PaymentStatus.FAILED;
    payment.errorMessage =
      paymentIntent.last_payment_error?.message ?? 'Payment failed';

    await this.paymentRepository.save(payment);
  }

  private async handleStripeRefund(charge: any): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { transactionId: charge.id },
    });

    if (!payment) {
      console.log(`Payment not found for charge ID: ${charge.id}`);
      return;
    }

    // Check if it's a full or partial refund
    const isFullRefund = charge.amount_refunded === charge.amount;

    // Update payment record
    payment.status = isFullRefund
      ? PaymentStatus.REFUNDED
      : PaymentStatus.PARTIALLY_REFUNDED;

    payment.paymentDetails = {
      ...(payment.paymentDetails || {}),
      refunded: true,
      refundedAmount: charge.amount_refunded / 100, // Convert from cents
    };

    await this.paymentRepository.save(payment);

    // If it was a full refund, update the order status
    if (isFullRefund) {
      await this.orderService.updateOrderStatus(payment.orderId, 'REFUNDED');
    }
  }

  private async handlePayPalPaymentCompleted(resource: any): Promise<void> {
    const paymentId = resource.custom_id; // This should be the order ID we sent

    const payment = await this.paymentRepository.findOne({
      where: { orderId: paymentId },
      order: { createdAt: 'DESC' }, // Get the most recent one
    });

    if (!payment) {
      console.log(`Payment not found for order ID: ${paymentId}`);
      return;
    }

    // Update payment record
    payment.status = PaymentStatus.SUCCEEDED;
    payment.transactionId = resource.id;

    await this.paymentRepository.save(payment);

    // Update order status
    await this.orderService.updateOrderStatus(payment.orderId, 'PAID');
  }

  private async handlePayPalPaymentFailed(resource: any): Promise<void> {
    const paymentId = resource.custom_id;

    const payment = await this.paymentRepository.findOne({
      where: { orderId: paymentId },
      order: { createdAt: 'DESC' }, // Get the most recent one
    });

    if (!payment) {
      console.log(`Payment not found for order ID: ${paymentId}`);
      return;
    }

    // Update payment record
    payment.status = PaymentStatus.FAILED;
    payment.errorMessage = resource.status_details?.reason ?? 'Payment failed';

    await this.paymentRepository.save(payment);
  }

  private async handlePayPalRefund(resource: any): Promise<void> {
    const originalCaptureId = resource.links
      .find((link: any) => link.rel === 'up')
      ?.href.split('/')
      .pop();

    if (!originalCaptureId) {
      console.log('Original capture ID not found in refund resource');
      return;
    }

    const payment = await this.paymentRepository.findOne({
      where: { transactionId: originalCaptureId },
    });

    if (!payment) {
      console.log(`Payment not found for transaction ID: ${originalCaptureId}`);
      return;
    }

    // Check if it's a full or partial refund
    const refundAmount = parseFloat(resource.amount.value);
    const originalAmount = payment.amount;
    const isFullRefund = refundAmount >= originalAmount;

    // Update payment record
    payment.status = isFullRefund
      ? PaymentStatus.REFUNDED
      : PaymentStatus.PARTIALLY_REFUNDED;

    payment.paymentDetails = {
      ...(payment.paymentDetails || {}),
      refunded: true,
      refundedAmount: refundAmount,
    };

    await this.paymentRepository.save(payment);

    // If it was a full refund, update the order status
    if (isFullRefund) {
      await this.orderService.updateOrderStatus(payment.orderId, 'REFUNDED');
    }
  }

  async findAll(): Promise<PaymentEntity[]> {
    return this.paymentRepository.find({
      relations: ['order'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByOrder(orderId: string): Promise<PaymentEntity[]> {
    return this.paymentRepository.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<PaymentEntity> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment not found with ID: ${id}`);
    }

    return payment;
  }

  async update(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentEntity> {
    const payment = await this.findOne(id);

    // Update payment properties
    Object.assign(payment, updatePaymentDto);

    return this.paymentRepository.save(payment);
  }

  async remove(id: string): Promise<void> {
    const result = await this.paymentRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Payment not found with ID: ${id}`);
    }
  }
}
