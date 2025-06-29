import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileType } from '../entities/uploaded-file.entity';

export class UploadFileDto {
  @ApiPropertyOptional({
    enum: FileType,
    default: FileType.OTHER,
    description: 'Type of file being uploaded',
  })
  @IsOptional()
  @IsEnum(FileType)
  fileType?: FileType;

  @ApiPropertyOptional({
    description: 'Folder to store the file in Cloudinary',
    example: 'products',
  })
  @IsOptional()
  @IsString()
  folder?: string;

  @ApiPropertyOptional({
    description: 'ID of the entity this file is attached to (e.g., product ID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Type of entity this file is attached to',
    example: 'product',
  })
  @IsOptional()
  @IsString()
  entityType?: string;
}
