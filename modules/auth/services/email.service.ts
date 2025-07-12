import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('email.host'),
      port: this.configService.get<number>('email.port'),
      secure: this.configService.get<boolean>('email.secure'),
      auth: {
        user: this.configService.get<string>('email.user'),
        pass: this.configService.get<string>('email.password'),
      },
    });
  }

  async sendForgotPasswordEmail(email: string, otp: string): Promise<void> {
    const mailOptions = {
      from: this.configService.get<string>('email.from'),
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset Request</h1>
        <p>You have requested to reset your password. Use the following OTP to reset your password:</p>
        <h2 style="color: #007bff;">${otp}</h2>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendVerificationEmail(email: string, otp: string): Promise<void> {
    const mailOptions = {
      from: this.configService.get<string>('email.from'),
      to: email,
      subject: 'Email Verification',
      html: `
        <h1>Email Verification</h1>
        <p>Please verify your email address using the following OTP:</p>
        <h2 style="color: #007bff;">${otp}</h2>
        <p>This OTP will expire in 10 minutes.</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async send2FASetupEmail(email: string): Promise<void> {
    const mailOptions = {
      from: this.configService.get<string>('email.from'),
      to: email,
      subject: 'Two-Factor Authentication Enabled',
      html: `
        <h1>Two-Factor Authentication Enabled</h1>
        <p>Two-factor authentication has been successfully enabled for your account.</p>
        <p>Your account is now more secure!</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
