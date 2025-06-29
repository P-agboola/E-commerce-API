import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadedFileEntity, FileType } from './entities/uploaded-file.entity';
import { CloudinaryProvider } from './providers/cloudinary.provider';
import { UploadFileDto } from './dto/upload-file.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime-types';

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(UploadedFileEntity)
    private readonly uploadRepository: Repository<UploadedFileEntity>,
    private readonly cloudinaryProvider: CloudinaryProvider,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    uploadFileDto: UploadFileDto,
  ): Promise<UploadedFileEntity> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      // Get file details
      const { originalname, mimetype, size, path: filePath } = file;
      const fileType =
        uploadFileDto.fileType || this.determineFileType(mimetype);

      // Upload to Cloudinary
      const cloudinaryResult = await this.cloudinaryProvider.uploadFile(
        filePath,
        {
          folder: uploadFileDto.folder,
          resourceType: this.getResourceType(mimetype),
          tags: [fileType],
        },
      );

      // Create database record
      const uploadedFile = this.uploadRepository.create({
        originalName: originalname,
        mimeType: mimetype,
        size,
        // 'url' stores the local file path for internal reference only; use 'cloudinaryUrl' for public access
        url: file.path,
        cloudinaryUrl: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        fileType,
        resourceType: cloudinaryResult.resource_type,
        folder: uploadFileDto.folder,
        metadata: cloudinaryResult,
        entityId: uploadFileDto.entityId,
        entityType: uploadFileDto.entityType,
      });

      // Clean up local file
      this.deleteLocalFile(filePath);

      return this.uploadRepository.save(uploadedFile);
    } catch (error) {
      if (file && file.path) {
        this.deleteLocalFile(file.path);
      }
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }
  }

  async findAll(): Promise<UploadedFileEntity[]> {
    return this.uploadRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findAllByEntity(
    entityType: string,
    entityId: string,
  ): Promise<UploadedFileEntity[]> {
    return this.uploadRepository.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<UploadedFileEntity> {
    const file = await this.uploadRepository.findOne({ where: { id } });

    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }

    return file;
  }

  async deleteFile(id: string): Promise<void> {
    const file = await this.findOne(id);

    if (file.publicId) {
      await this.cloudinaryProvider.deleteFile(file.publicId);
    }

    const result = await this.uploadRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }
  }

  // Helper methods
  private determineFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) {
      return FileType.IMAGE;
    } else if (
      mimeType === 'application/pdf' ||
      mimeType === 'application/msword' ||
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return FileType.DOCUMENT;
    }
    return FileType.OTHER;
  }

  private getResourceType(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return 'image';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else {
      return 'auto';
    }
  }

  private deleteLocalFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Failed to delete local file: ${filePath}`, error);
    }
  }
}
