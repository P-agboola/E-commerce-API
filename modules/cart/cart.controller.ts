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
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CartService } from './cart.service';
import { AddToCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user cart' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the current user cart',
  })
  async getUserCart(@Request() req) {
    const cart = await this.cartService.findByUserId(req.user.id);
    const totals = await this.cartService.calculateTotals(cart);
    return { cart, totals };
  }

  @Post('items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiBody({ type: AddToCartItemDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Item added to cart successfully',
  })
  async addToCart(@Request() req, @Body() addToCartDto: AddToCartItemDto) {
    const cart = await this.cartService.addItem(req.user.id, addToCartDto);
    const totals = await this.cartService.calculateTotals(cart);
    return { cart, totals };
  }

  @Patch('items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update item quantity in cart' })
  @ApiBody({ type: UpdateCartItemDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item quantity updated successfully',
  })
  async updateCartItem(
    @Request() req,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    const cart = await this.cartService.updateItemQuantity(
      req.user.id,
      updateCartItemDto,
    );
    const totals = await this.cartService.calculateTotals(cart);
    return { cart, totals };
  }

  @Delete('items/:index')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiParam({ name: 'index', description: 'Item index in cart' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item removed from cart successfully',
  })
  async removeCartItem(@Request() req, @Param('index') indexStr: string) {
    const index = parseInt(indexStr, 10);

    if (isNaN(index)) {
      throw new BadRequestException('Invalid item index');
    }

    const cart = await this.cartService.removeItem(req.user.id, index);
    const totals = await this.cartService.calculateTotals(cart);
    return { cart, totals };
  }

  @Delete('clear')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear cart' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cart cleared successfully',
  })
  async clearCart(@Request() req) {
    const cart = await this.cartService.clear(req.user.id);
    const totals = await this.cartService.calculateTotals(cart);
    return { cart, totals };
  }

  @Post('merge-guest-cart')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Merge guest cart with user cart' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'Guest session ID',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Carts merged successfully',
  })
  async mergeGuestCart(@Request() req, @Body() body: { sessionId: string }) {
    const cart = await this.cartService.mergeGuestCart(
      body.sessionId,
      req.user.id,
    );
    const totals = await this.cartService.calculateTotals(cart);
    return { cart, totals };
  }

  // Guest cart endpoints
  @Get('guest/:sessionId')
  @ApiOperation({ summary: 'Get guest cart by session ID' })
  @ApiParam({ name: 'sessionId', description: 'Guest session ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the guest cart',
  })
  async getGuestCart(@Param('sessionId') sessionId: string) {
    const cart = await this.cartService.findBySessionId(sessionId);
    const totals = await this.cartService.calculateTotals(cart);
    return { cart, totals };
  }

  @Post('guest/:sessionId/items')
  @ApiOperation({ summary: 'Add item to guest cart' })
  @ApiParam({ name: 'sessionId', description: 'Guest session ID' })
  @ApiBody({ type: AddToCartItemDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Item added to guest cart successfully',
  })
  async addToGuestCart(
    @Param('sessionId') sessionId: string,
    @Body() addToCartDto: AddToCartItemDto,
  ) {
    // Find or create guest cart
    const guestCart = await this.cartService.findBySessionId(sessionId);

    // Add item to the cart using the userId of the guest cart
    const cart = await this.cartService.addItem(guestCart.userId, addToCartDto);
    const totals = await this.cartService.calculateTotals(cart);

    return { cart, totals };
  }
}
