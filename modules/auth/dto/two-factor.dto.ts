import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: '123456' })
  @IsNotEmpty()
  @IsString()
  otp: string;
}

export class EnableTwoFactorDto {
  @ApiProperty({ example: '123456' })
  @IsNotEmpty()
  @IsString()
  token: string;
}

export class DisableTwoFactorDto {
  @ApiProperty({ example: '123456' })
  @IsNotEmpty()
  @IsString()
  token: string;
}
