import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApplyCouponDto {
  @ApiProperty({ description: 'Coupon code to apply', example: 'SUMMER2025' })
  @IsString()
  code: string;
}
