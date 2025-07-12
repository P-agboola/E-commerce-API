import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class UpdateUserDto {
  @ApiProperty({ description: 'User first name', required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ description: 'User last name', required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'User role', enum: UserRole, required: false })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ description: 'User avatar URL', required: false })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({
    description: 'Whether the email is verified',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isEmailVerified?: boolean;

  @ApiProperty({ description: 'User address', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ description: 'User phone number', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  // New fields for enhanced auth features
  @ApiProperty({ description: 'User password', required: false })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({
    description: 'Two-factor authentication secret',
    required: false,
  })
  @IsString()
  @IsOptional()
  twoFactorSecret?: string;

  @ApiProperty({
    description: 'Temporary two-factor authentication secret',
    required: false,
  })
  @IsString()
  @IsOptional()
  tempTwoFactorSecret?: string;

  @ApiProperty({
    description: 'Whether two-factor authentication is enabled',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isTwoFactorEnabled?: boolean;

  @ApiProperty({ description: 'Google ID for social login', required: false })
  @IsString()
  @IsOptional()
  googleId?: string;

  @ApiProperty({ description: 'Login provider', required: false })
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiProperty({ description: 'OTP code for verification', required: false })
  @IsString()
  @IsOptional()
  otpCode?: string;

  @ApiProperty({ description: 'OTP code expiry date', required: false })
  @IsOptional()
  otpCodeExpiry?: Date;

  @ApiProperty({ description: 'Forgot password OTP', required: false })
  @IsString()
  @IsOptional()
  forgotPasswordOtp?: string;

  @ApiProperty({
    description: 'Forgot password OTP expiry date',
    required: false,
  })
  @IsOptional()
  forgotPasswordOtpExpiry?: Date;

  @ApiProperty({ description: 'Reset password token', required: false })
  @IsString()
  @IsOptional()
  resetPasswordToken?: string;

  @ApiProperty({
    description: 'Reset password token expiry date',
    required: false,
  })
  @IsOptional()
  resetPasswordTokenExpiry?: Date;
}
