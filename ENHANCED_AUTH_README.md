# Enhanced Authentication Features

## Overview
This implementation adds comprehensive authentication features to your NestJS e-commerce API:

1. **Forgot Password & Reset Password**
2. **Two-Factor Authentication (2FA)**
3. **Social Login (Google OAuth)**

## New Endpoints

### Forgot Password Flow
```
POST /auth/forgot-password
POST /auth/verify-forgot-password-otp
POST /auth/reset-password
```

### Two-Factor Authentication
```
GET /auth/2fa/generate
POST /auth/2fa/enable
POST /auth/2fa/disable
POST /auth/login-with-2fa
```

### Social Login
```
GET /auth/google
POST /auth/google
GET /auth/google/callback
```

## Environment Variables Required

Add these to your `.env` file:

```env
# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=no-reply@ecommerce.com

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Two-Factor Authentication
TWO_FACTOR_APP_NAME=E-commerce API
TWO_FACTOR_ISSUER=E-commerce
```

## Features Added

### 1. Forgot Password
- Send OTP to user's email
- Verify OTP and get reset token
- Reset password using token

### 2. Two-Factor Authentication
- Generate QR code for authenticator apps
- Enable/disable 2FA
- Login with 2FA token support

### 3. Social Login
- Google OAuth integration
- Account linking for existing users
- Automatic account creation for new users

## API Usage Examples

### Forgot Password Flow
```bash
# 1. Request password reset
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# 2. Verify OTP
curl -X POST http://localhost:3000/auth/verify-forgot-password-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "otp": "123456"}'

# 3. Reset password
curl -X POST http://localhost:3000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "reset-token", "password": "newpassword", "passwordConfirmation": "newpassword"}'
```

### 2FA Setup
```bash
# 1. Generate QR code (requires authentication)
curl -X GET http://localhost:3000/auth/2fa/generate \
  -H "Authorization: Bearer your-jwt-token"

# 2. Enable 2FA
curl -X POST http://localhost:3000/auth/2fa/enable \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"token": "123456"}'

# 3. Login with 2FA
curl -X POST http://localhost:3000/auth/login-with-2fa \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password", "twoFactorToken": "123456"}'
```

## Database Changes

The User entity has been extended with new fields:
- `isTwoFactorEnabled`: Boolean for 2FA status
- `twoFactorSecret`: Encrypted 2FA secret
- `tempTwoFactorSecret`: Temporary secret during setup
- `googleId`: Google account ID for social login
- `provider`: Login provider (local, google)
- `otpCode` & `otpCodeExpiry`: For general OTP verification
- `forgotPasswordOtp` & `forgotPasswordOtpExpiry`: For password reset
- `resetPasswordToken` & `resetPasswordTokenExpiry`: For secure password reset

## Security Features

1. **OTP Expiry**: All OTPs expire after 10 minutes
2. **Rate Limiting**: Implement rate limiting on sensitive endpoints
3. **Secure Tokens**: Reset tokens are cryptographically secure
4. **Time-based 2FA**: TOTP compatible with Google Authenticator
5. **Email Notifications**: Users receive emails for security events

## Setup Instructions

1. Install the required packages (already done):
   ```bash
   npm install passport-google-oauth20 @types/passport-google-oauth20 speakeasy qrcode @types/qrcode nodemailer @types/nodemailer uuid crypto-js @types/crypto-js
   ```

2. Update your database schema to include the new User entity fields

3. Configure email settings in your environment variables

4. Set up Google OAuth credentials in Google Cloud Console

5. Test the endpoints using the provided examples

## Production Considerations

1. **Email Service**: Configure a proper email service (SendGrid, AWS SES, etc.)
2. **2FA Library**: Consider using `speakeasy` for production-grade 2FA
3. **QR Code Generation**: Implement proper QR code generation on the backend
4. **Rate Limiting**: Add rate limiting middleware
5. **Logging**: Add comprehensive logging for security events
6. **Database Migration**: Create proper database migrations for the new fields
