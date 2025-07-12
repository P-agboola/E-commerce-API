import {
  Injectable,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokensDto } from './dto/tokens.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EnableTwoFactorDto, VerifyOtpDto } from './dto/two-factor.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../user/entities/user.entity';
import { EmailService } from './services/email.service';
import { TwoFactorService } from './services/two-factor.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    if (registerDto.password !== registerDto.passwordConfirmation) {
      throw new ForbiddenException('Passwords do not match');
    }

    // Check if user exists
    const userExists = await this.userService.findByEmail(registerDto.email);
    if (userExists) {
      throw new ForbiddenException('Email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(registerDto.password);

    // Create user
    return this.userService.create({
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      email: registerDto.email,
      password: hashedPassword,
      role: UserRole.CUSTOMER, // Default role for new users
    });
  }

  async login(loginDto: LoginDto): Promise<TokensDto> {
    // Find user by email
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    return this.generateTokens(user);
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<TokensDto> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get<string>('auth.jwt.refreshSecret'),
      });

      // Find user by id
      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      // Generate new tokens
      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async generateTokens(user: User): Promise<TokensDto> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
        },
        {
          secret: this.configService.get<string>('auth.jwt.secret'),
          expiresIn: this.configService.get<number>('auth.jwt.expiresIn'),
        },
      ),
      this.jwtService.signAsync(
        {
          sub: user.id,
        },
        {
          secret: this.configService.get<string>('auth.jwt.refreshSecret'),
          expiresIn: this.configService.get<number>(
            'auth.jwt.refreshExpiresIn',
          ),
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.get<number>('auth.jwt.expiresIn') ?? 3600,
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Forgot Password functionality
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const user = await this.userService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return;
    }

    const otp = this.twoFactorService.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.userService.update(user.id, {
      forgotPasswordOtp: otp,
      forgotPasswordOtpExpiry: otpExpiry,
    });

    await this.emailService.sendForgotPasswordEmail(user.email, otp);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    if (resetPasswordDto.password !== resetPasswordDto.passwordConfirmation) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.userService.findOne({
      where: { resetPasswordToken: resetPasswordDto.token },
    });

    if (!user || !user.resetPasswordTokenExpiry) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (new Date() > user.resetPasswordTokenExpiry) {
      throw new UnauthorizedException('Token has expired');
    }

    const hashedPassword = await this.hashPassword(resetPasswordDto.password);

    await this.userService.update(user.id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordTokenExpiry: null,
    });
  }

  async verifyForgotPasswordOtp(email: string, otp: string): Promise<string> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.forgotPasswordOtp || !user.forgotPasswordOtpExpiry) {
      throw new UnauthorizedException('No OTP request found');
    }

    if (new Date() > user.forgotPasswordOtpExpiry) {
      throw new UnauthorizedException('OTP has expired');
    }

    if (user.forgotPasswordOtp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await this.userService.update(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordTokenExpiry: resetTokenExpiry,
      forgotPasswordOtp: null,
      forgotPasswordOtpExpiry: null,
    });

    return resetToken;
  }

  // Two-Factor Authentication
  async generateTwoFactorSecret(
    userId: string,
  ): Promise<{ qrCode: string; secret: string }> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { secret, qrCodeUrl } = this.twoFactorService.generateSecret(
      user.email,
    );
    const qrCode = this.twoFactorService.generateQRCode(qrCodeUrl);

    // Store temporary secret
    await this.userService.update(user.id, {
      tempTwoFactorSecret: secret,
    });

    return { qrCode, secret };
  }

  async enableTwoFactor(
    userId: string,
    enableTwoFactorDto: EnableTwoFactorDto,
  ): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user || !user.tempTwoFactorSecret) {
      throw new BadRequestException('No pending two-factor setup found');
    }

    const isValid = this.twoFactorService.verifyToken(
      user.tempTwoFactorSecret,
      enableTwoFactorDto.token,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid token');
    }

    await this.userService.update(user.id, {
      twoFactorSecret: user.tempTwoFactorSecret,
      tempTwoFactorSecret: null,
      isTwoFactorEnabled: true,
    });

    await this.emailService.send2FASetupEmail(user.email);
  }

  async disableTwoFactor(
    userId: string,
    disableTwoFactorDto: EnableTwoFactorDto,
  ): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    const isValid = this.twoFactorService.verifyToken(
      user.twoFactorSecret,
      disableTwoFactorDto.token,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid token');
    }

    await this.userService.update(user.id, {
      twoFactorSecret: null,
      isTwoFactorEnabled: false,
    });
  }

  async verifyTwoFactorToken(userId: string, token: string): Promise<boolean> {
    const user = await this.userService.findById(userId);
    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    return this.twoFactorService.verifyToken(user.twoFactorSecret, token);
  }

  // Social Login
  async googleLogin(
    googleUser: any,
  ): Promise<{ tokens: TokensDto; isNewUser: boolean }> {
    let user = await this.userService.findByEmail(googleUser.email);
    let isNewUser = false;

    if (!user) {
      // Create new user
      user = await this.userService.create({
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        googleId: googleUser.googleId,
        provider: 'google',
        isEmailVerified: true,
        avatar: googleUser.avatar,
        // Generate a random password for social users
        password: await this.hashPassword(
          crypto.randomBytes(32).toString('hex'),
        ),
        role: UserRole.CUSTOMER,
      });
      isNewUser = true;
    } else if (!user.googleId) {
      // Link existing account with Google
      await this.userService.update(user.id, {
        googleId: googleUser.googleId,
        isEmailVerified: true,
        avatar: googleUser.avatar || user.avatar,
      });
    }

    const tokens = await this.generateTokens(user);
    return { tokens, isNewUser };
  }

  // Enhanced login with 2FA support
  async loginWithTwoFactor(
    loginDto: LoginDto,
    twoFactorToken?: string,
  ): Promise<TokensDto> {
    // Find user by email
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if 2FA is enabled
    if (user.isTwoFactorEnabled && user.twoFactorSecret) {
      if (!twoFactorToken) {
        throw new UnauthorizedException(
          'Two-factor authentication token required',
        );
      }

      const isValidToken = this.twoFactorService.verifyToken(
        user.twoFactorSecret,
        twoFactorToken,
      );

      if (!isValidToken) {
        throw new UnauthorizedException(
          'Invalid two-factor authentication token',
        );
      }
    }

    // Generate tokens
    return this.generateTokens(user);
  }
}
