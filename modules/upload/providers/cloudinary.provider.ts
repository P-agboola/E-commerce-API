import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryProvider {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('cloudinary.cloudName'),
      api_key: this.configService.get<string>('cloudinary.apiKey'),
      api_secret: this.configService.get<string>('cloudinary.apiSecret'),
    });
  }

  async uploadFile(
    filePath: string,
    options: {
      folder?: string;
      resourceType?: string;
      tags?: string[];
      transformation?: any;
    } = {},
  ): Promise<any> {
    const folder =
      options.folder || this.configService.get<string>('cloudinary.folder');

    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: (options.resourceType ?? 'auto') as
          | 'image'
          | 'video'
          | 'raw'
          | 'auto',
        tags: options.tags ?? [],
        transformation: options.transformation ?? [],
      });

      return result;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }

  async deleteFile(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw error;
    }
  }

  getImageUrl(publicId: string, options: any = {}): string {
    return cloudinary.url(publicId, options);
  }
}
