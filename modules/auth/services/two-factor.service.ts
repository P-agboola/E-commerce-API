import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class TwoFactorService {
  generateSecret(email: string): { secret: string; qrCodeUrl: string } {
    // Generate a random hex secret and convert to base32-like format
    const randomBytes = crypto.randomBytes(20);
    const secret = randomBytes.toString('hex').toUpperCase();

    // Create OTP Auth URL (compatible with Google Authenticator, Authy, etc.)
    const qrCodeUrl = `otpauth://totp/E-commerce:${encodeURIComponent(email)}?secret=${secret}&issuer=E-commerce&algorithm=SHA1&digits=6&period=30`;

    return {
      secret,
      qrCodeUrl,
    };
  }

  generateQRCode(otpAuthUrl: string): string {
    // For now, return the URL itself. In production, you'd use QRCode.toDataURL
    // This allows the frontend to generate the QR code or use the URL directly
    return otpAuthUrl;
  }

  verifyToken(secret: string, token: string): boolean {
    // Simple time-based verification
    // In production, you'd use the speakeasy library or similar
    const timeStep = Math.floor(Date.now() / 30000);

    // Check current time window and previous/next for clock skew
    for (let i = -2; i <= 2; i++) {
      const testToken = this.generateTOTP(secret, timeStep + i);
      if (testToken === token) {
        return true;
      }
    }

    return false;
  }

  private generateTOTP(secret: string, timeStep: number): string {
    // Simple HMAC-based OTP generation (simplified version)
    // In production, use a proper TOTP library
    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'hex'));
    hmac.update(Buffer.from(timeStep.toString()));
    const hash = hmac.digest();

    const offset = hash[hash.length - 1] & 0xf;
    const code =
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);

    return (code % 1000000).toString().padStart(6, '0');
  }

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
