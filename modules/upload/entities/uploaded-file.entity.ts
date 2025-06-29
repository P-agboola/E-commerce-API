import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../lib/entities/base.entity';

export enum FileType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  OTHER = 'other',
}

@Entity('uploaded_files')
export class UploadedFileEntity extends BaseEntity {
  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  @Column()
  url: string;

  @Column({ nullable: true })
  publicId: string; // Cloudinary public ID

  @Column({ nullable: true })
  cloudinaryUrl: string;

  @Column({ type: 'enum', enum: FileType, default: FileType.OTHER })
  fileType: FileType;

  @Column({ nullable: true })
  resourceType: string; // Cloudinary resource type: image, video, raw, etc.

  @Column({ nullable: true })
  folder: string;

  // Additional metadata from Cloudinary
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // Optional relationships
  @Column({ nullable: true })
  entityId: string; // ID of the entity this file is attached to (e.g., a product ID)

  @Column({ nullable: true })
  entityType: string; // Type of the entity (e.g., 'product', 'user', etc.)
}
