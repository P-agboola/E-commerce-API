import { registerAs } from '@nestjs/config';

export default registerAs('cloudinary', () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? 'your_cloud_name',
  apiKey: process.env.CLOUDINARY_API_KEY ?? 'your_api_key',
  apiSecret: process.env.CLOUDINARY_API_SECRET ?? 'your_api_secret',
  folder: process.env.CLOUDINARY_FOLDER ?? 'ecommerce',
}));
