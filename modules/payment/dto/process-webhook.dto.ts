import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ProcessWebhookDto {
  @ApiProperty({ description: 'Webhook payload', type: Object })
  @IsNotEmpty()
  payload: Record<string, any>;

  @ApiProperty({ description: 'Webhook signature (for validation)' })
  @IsString()
  signature: string;
}
