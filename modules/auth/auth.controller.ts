import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokensDto } from './dto/tokens.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EnableTwoFactorDto, VerifyOtpDto } from './dto/two-factor.dto';
import { GoogleLoginDto, SocialLoginResponseDto } from './dto/social-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from '../../lib/decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Email already exists',
  })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    return {
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User logged in successfully',
    type: TokensDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto): Promise<TokensDto> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
    type: TokensDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid token',
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<TokensDto> {
    return this.authService.refreshTokens(refreshTokenDto);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User info retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async getProfile(@Request() req: { user: any }) {
    return {
      user: req.user,
    };
  }

  // Forgot Password endpoints
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset OTP sent to email',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);
    return {
      message: 'If the email exists, a password reset OTP has been sent.',
    };
  }

  @Public()
  @Post('verify-forgot-password-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify forgot password OTP' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP verified, reset token provided',
  })
  async verifyForgotPasswordOtp(@Body() body: { email: string; otp: string }) {
    const resetToken = await this.authService.verifyForgotPasswordOtp(
      body.email,
      body.otp,
    );
    return {
      message: 'OTP verified successfully',
      resetToken,
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return {
      message: 'Password reset successfully',
    };
  }

  // Two-Factor Authentication endpoints
  @Get('2fa/generate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate 2FA QR code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '2FA QR code generated',
  })
  async generateTwoFactorSecret(@Request() req: { user: any }) {
    const { qrCode, secret } = await this.authService.generateTwoFactorSecret(
      req.user.sub,
    );
    return {
      qrCode,
      secret,
      message: 'Scan this QR code with your authenticator app',
    };
  }

  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable 2FA' })
  @ApiBody({ type: EnableTwoFactorDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '2FA enabled successfully',
  })
  async enableTwoFactor(
    @Request() req: { user: any },
    @Body() enableTwoFactorDto: EnableTwoFactorDto,
  ) {
    await this.authService.enableTwoFactor(req.user.sub, enableTwoFactorDto);
    return {
      message: 'Two-factor authentication enabled successfully',
    };
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA' })
  @ApiBody({ type: EnableTwoFactorDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '2FA disabled successfully',
  })
  async disableTwoFactor(
    @Request() req: { user: any },
    @Body() disableTwoFactorDto: EnableTwoFactorDto,
  ) {
    await this.authService.disableTwoFactor(req.user.sub, disableTwoFactorDto);
    return {
      message: 'Two-factor authentication disabled successfully',
    };
  }

  @Post('login-with-2fa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with 2FA' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User logged in successfully',
    type: TokensDto,
  })
  async loginWithTwoFactor(
    @Body() body: { email: string; password: string; twoFactorToken?: string },
  ): Promise<TokensDto> {
    return this.authService.loginWithTwoFactor(
      { email: body.email, password: body.password },
      body.twoFactorToken,
    );
  }

  // Social Login endpoints
  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Google OAuth login' })
  @ApiBody({ type: GoogleLoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Google login successful',
    type: SocialLoginResponseDto,
  })
  async googleLogin(@Body() googleLoginDto: GoogleLoginDto) {
    // This would typically verify the Google ID token
    // For now, it's a placeholder for the Google OAuth flow
    return {
      message: 'Google login endpoint - implement Google ID token verification',
    };
  }

  @Public()
  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth' })
  async googleAuth() {
    return {
      message: 'Redirect to Google OAuth',
      url: `https://accounts.google.com/oauth/authorize?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_CALLBACK_URL}&scope=openid%20profile%20email&response_type=code`,
    };
  }

  @Public()
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(@Request() req: any) {
    const { tokens, isNewUser } = await this.authService.googleLogin(req.user);
    return {
      ...tokens,
      isNewUser,
      message: isNewUser
        ? 'Account created and logged in'
        : 'Logged in successfully',
    };
  }
}
