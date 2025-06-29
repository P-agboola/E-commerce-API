import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, ReviewStatus } from './entities/review.entity';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewFilterDto,
} from './dto/review.dto';
import { ProductService } from '../product/product.service';
import { OrderService } from '../order/order.service';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    private productService: ProductService,
    private orderService: OrderService,
  ) {}

  async create(
    userId: string,
    createReviewDto: CreateReviewDto,
  ): Promise<Review> {
    // Verify product exists
    const product = await this.productService.findOne(
      createReviewDto.productId,
    );

    // Check if user has already reviewed this product
    const existingReview = await this.reviewRepository.findOne({
      where: {
        userId,
        productId: createReviewDto.productId,
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    // Check if this is a verified purchase
    let isVerifiedPurchase = false;
    if (createReviewDto.orderId) {
      try {
        const order = await this.orderService.findOne(createReviewDto.orderId);
        // Check if order belongs to this user and contains this product
        if (order.userId === userId) {
          // Look for the product in order items
          const orderItems = await this.orderService.findOrderItems(order.id);
          isVerifiedPurchase = orderItems.some(
            (item) => item.productId === createReviewDto.productId,
          );
        }
      } catch (error) {
        // Order not found or doesn't belong to user - not a verified purchase
      }
    }

    // Create review
    const review = this.reviewRepository.create({
      userId,
      productId: createReviewDto.productId,
      rating: createReviewDto.rating,
      comment: createReviewDto.comment,
      images: createReviewDto.images,
      orderId: createReviewDto.orderId,
      status: ReviewStatus.PENDING, // Default to pending for moderation
      isVerifiedPurchase,
      helpfulCount: 0,
      helpfulUserIds: [],
    });

    const savedReview = await this.reviewRepository.save(review);

    // Update product rating
    await this.updateProductRating(createReviewDto.productId);

    return savedReview;
  }

  async findAll(filters: ReviewFilterDto): Promise<Review[]> {
    const query = this.reviewRepository.createQueryBuilder('review');

    // Apply filters
    if (filters.productId) {
      query.andWhere('review.productId = :productId', {
        productId: filters.productId,
      });
    }

    if (filters.userId) {
      query.andWhere('review.userId = :userId', { userId: filters.userId });
    }

    if (filters.minRating) {
      query.andWhere('review.rating >= :minRating', {
        minRating: filters.minRating,
      });
    }

    if (filters.status) {
      query.andWhere('review.status = :status', { status: filters.status });
    } else {
      // By default, only show approved reviews
      query.andWhere('review.status = :status', {
        status: ReviewStatus.APPROVED,
      });
    }

    if (filters.verifiedOnly) {
      query.andWhere('review.isVerifiedPurchase = true');
    }

    // Order by most recent first
    query.orderBy('review.createdAt', 'DESC');

    return query.getMany();
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async update(
    id: string,
    userId: string,
    updateReviewDto: UpdateReviewDto,
    isAdmin: boolean,
  ): Promise<Review> {
    const review = await this.findOne(id);

    // Only the author or admin can update a review
    if (review.userId !== userId && !isAdmin) {
      throw new BadRequestException(
        'You are not authorized to update this review',
      );
    }

    // Update review fields
    if (updateReviewDto.rating !== undefined) {
      review.rating = updateReviewDto.rating;
    }

    if (updateReviewDto.comment !== undefined) {
      review.comment = updateReviewDto.comment;
    }

    if (updateReviewDto.images !== undefined) {
      review.images = updateReviewDto.images;
    }

    // Only admins can update the status
    if (isAdmin && updateReviewDto.status !== undefined) {
      review.status = updateReviewDto.status;
    }

    const updatedReview = await this.reviewRepository.save(review);

    // Update product rating if rating changed
    if (updateReviewDto.rating !== undefined) {
      await this.updateProductRating(review.productId);
    }

    return updatedReview;
  }

  async remove(id: string, userId: string, isAdmin: boolean): Promise<void> {
    const review = await this.findOne(id);

    // Only the author or admin can delete a review
    if (review.userId !== userId && !isAdmin) {
      throw new BadRequestException(
        'You are not authorized to delete this review',
      );
    }

    await this.reviewRepository.remove(review);

    // Update product rating
    await this.updateProductRating(review.productId);
  }

  async markHelpful(id: string, userId: string): Promise<Review> {
    const review = await this.findOne(id);

    // Check if user already marked this review as helpful
    if (!review.helpfulUserIds) {
      review.helpfulUserIds = [];
    }

    const alreadyMarked = review.helpfulUserIds.includes(userId);

    if (alreadyMarked) {
      // Remove user from helpfulUserIds
      review.helpfulUserIds = review.helpfulUserIds.filter(
        (id) => id !== userId,
      );
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    } else {
      // Add user to helpfulUserIds
      review.helpfulUserIds.push(userId);
      review.helpfulCount++;
    }

    return this.reviewRepository.save(review);
  }

  async updateProductRating(productId: string): Promise<void> {
    // Get all approved reviews for this product
    const reviews = await this.reviewRepository.find({
      where: {
        productId,
        status: ReviewStatus.APPROVED,
      },
    });

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating =
      reviews.length > 0 ? Math.round(totalRating / reviews.length) : 0;

    // Update product rating and review count
    await this.productService.update(productId, {
      rating: averageRating,
      reviewCount: reviews.length,
    });
  }

  async moderateReview(id: string, status: ReviewStatus): Promise<Review> {
    const review = await this.findOne(id);

    review.status = status;

    const updatedReview = await this.reviewRepository.save(review);

    if (status === ReviewStatus.APPROVED || status === ReviewStatus.REJECTED) {
      // Update product rating
      await this.updateProductRating(review.productId);
    }

    return updatedReview;
  }

  async getReviewStatistics(productId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingBreakdown: Record<number, number>;
    verifiedPurchases: number;
  }> {
    const reviews = await this.reviewRepository.find({
      where: {
        productId,
        status: ReviewStatus.APPROVED,
      },
    });

    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

    // Calculate rating breakdown
    const ratingBreakdown: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    reviews.forEach((review) => {
      ratingBreakdown[review.rating]++;
    });

    // Count verified purchases
    const verifiedPurchases = reviews.filter(
      (review) => review.isVerifiedPurchase,
    ).length;

    return {
      averageRating,
      totalReviews,
      ratingBreakdown,
      verifiedPurchases,
    };
  }
}
