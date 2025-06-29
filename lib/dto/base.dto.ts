import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsDate, IsOptional } from 'class-validator';

export class BaseDto {
  @ApiProperty({ description: 'Unique identifier' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Creation date' })
  @IsDate()
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  @IsDate()
  updatedAt: Date;

  @ApiProperty({ description: 'Deletion date', required: false })
  @IsDate()
  @IsOptional()
  deletedAt?: Date;
}
