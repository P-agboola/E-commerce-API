import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WishlistService } from './wishlist.service';

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
