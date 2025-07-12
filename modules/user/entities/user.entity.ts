import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../lib/entities/base.entity';
import { UserRole } from '../../../common/enums/user-role.enum';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User extends BaseEntity {
  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar' })
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Column({ type: 'text', nullable: true })
  avatar?: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ type: 'text', nullable: true })
  @Exclude({ toPlainOnly: true })
  refreshToken?: string;

  @Column({ type: 'text', nullable: true })
  verificationToken?: string;

  @Column({ type: 'timestamptz', nullable: true })
  verificationTokenExpiry?: Date;

  @Column({ type: 'text', nullable: true })
  resetPasswordToken?: string;

  @Column({ type: 'timestamptz', nullable: true })
  resetPasswordTokenExpiry?: Date;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ nullable: true })
  phone?: string;

  // 2FA fields
  @Column({ default: false })
  isTwoFactorEnabled: boolean;

  @Column({ type: 'text', nullable: true })
  @Exclude({ toPlainOnly: true })
  twoFactorSecret?: string;

  @Column({ type: 'text', nullable: true })
  @Exclude({ toPlainOnly: true })
  tempTwoFactorSecret?: string;

  // Social login fields
  @Column({ type: 'text', nullable: true })
  googleId?: string;

  @Column({ type: 'text', nullable: true })
  facebookId?: string;

  @Column({ default: 'local' })
  provider: string; // 'local', 'google', 'facebook'

  // OTP fields for password reset and verification
  @Column({ type: 'text', nullable: true })
  @Exclude({ toPlainOnly: true })
  otpCode?: string;

  @Column({ type: 'timestamptz', nullable: true })
  otpCodeExpiry?: Date;

  @Column({ type: 'text', nullable: true })
  @Exclude({ toPlainOnly: true })
  forgotPasswordOtp?: string;

  @Column({ type: 'timestamptz', nullable: true })
  forgotPasswordOtpExpiry?: Date;

  // Virtual fields not stored in the database
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
