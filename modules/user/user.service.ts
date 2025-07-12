import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { plainToInstance } from 'class-transformer';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findAll(): Promise<UserDto[]> {
    const users = await this.userRepository.find();
    return plainToInstance(UserDto, users);
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findOne(options: FindOneOptions<User>): Promise<User | null> {
    return this.userRepository.findOne(options);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async updateRefreshToken(
    id: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.userRepository.update(id, {
      refreshToken: refreshToken,
    });
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.softRemove(user);
  }

  async findByRole(role: UserRole): Promise<UserDto[]> {
    const users = await this.userRepository.find({ where: { role } });
    return plainToInstance(UserDto, users);
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.userRepository.update(id, { password: hashedPassword });
  }

  async setVerified(id: string): Promise<User> {
    const user = await this.findById(id);
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    return this.userRepository.save(user);
  }

  async setVerificationToken(
    id: string,
    token: string,
    expiry: Date,
  ): Promise<void> {
    await this.userRepository.update(id, {
      verificationToken: token,
      verificationTokenExpiry: expiry,
    });
  }

  async setResetPasswordToken(
    id: string,
    token: string,
    expiry: Date,
  ): Promise<void> {
    await this.userRepository.update(id, {
      resetPasswordToken: token,
      resetPasswordTokenExpiry: expiry,
    });
  }

  async clearResetPasswordToken(id: string): Promise<void> {
    await this.userRepository.update(id, {
      resetPasswordToken: undefined,
      resetPasswordTokenExpiry: undefined,
    });
  }
}
