import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ReviewService } from './review.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewFilterDto,
} from './dto/review.dto';
import { ReviewStatus } from './entities/review.entity';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new review' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Review has been successfully created',
  })
  create(@Request() req, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewService.create(req.user.id, createReviewDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get reviews with filters' })
  @ApiQuery({
    name: 'productId',
    required: false,
    description: 'Filter by product ID',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Filter by user ID',
  })
  @ApiQuery({
    name: 'minRating',
    required: false,
    description: 'Filter by minimum rating',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'verifiedOnly',
    required: false,
    description: 'Filter to verified purchases only',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return reviews based on filters',
  })
  findAll(@Query() filters: ReviewFilterDto) {
    return this.reviewService.findAll(filters);
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user reviews' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return current user reviews',
  })
  findUserReviews(@Request() req) {
    const filters: ReviewFilterDto = {
      userId: req.user.id,
    };
    return this.reviewService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by id' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the review',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Review not found',
  })
  findOne(@Param('id') id: string) {
    return this.reviewService.findOne(id);
  }

  @Get('product/:id/statistics')
  @ApiOperation({ summary: 'Get review statistics for product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return product review statistics',
  })
  getStatistics(@Param('id') productId: string) {
    return this.reviewService.getReviewStatistics(productId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review has been successfully updated',
  })
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewService.update(
      id,
      req.user.id,
      updateReviewDto,
      req.user.roles?.includes('admin'),
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Review has been successfully deleted',
  })
  remove(@Param('id') id: string, @Request() req) {
    return this.reviewService.remove(
      id,
      req.user.id,
      req.user.roles?.includes('admin'),
    );
  }

  @Post(':id/helpful')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark review as helpful or remove mark' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review has been marked as helpful or mark has been removed',
  })
  markHelpful(@Param('id') id: string, @Request() req) {
    return this.reviewService.markHelpful(id, req.user.id);
  }

  @Patch(':id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Moderate review (admin only)' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Review has been moderated',
  })
  moderate(@Param('id') id: string, @Body() body: { status: ReviewStatus }) {
    return this.reviewService.moderateReview(id, body.status);
  }
}
