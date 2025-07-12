import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from '../user.service';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserRole } from '../../../common/enums/user-role.enum';
import { NotFoundException } from '@nestjs/common';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UserService', () => {
  let userService: UserService;
  let userRepository: MockRepository<User>;

  const mockUser = {
    id: 'test-user-id',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'hashedPassword',
    role: UserRole.CUSTOMER,
    isEmailVerified: false,
    verificationToken: null,
    verificationTokenExpiry: null,
    resetPasswordToken: null,
    resetPasswordTokenExpiry: null,
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockUserRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      softRemove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<MockRepository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'hashedPassword',
        role: UserRole.CUSTOMER,
      };

      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      const result = await userService.create(createUserDto);

      expect(userRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      userRepository.find.mockResolvedValue([mockUser]);

      const result = await userService.findAll();

      expect(userRepository.find).toHaveBeenCalled();
      expect(result.length).toEqual(1);
      expect(result[0].id).toEqual(mockUser.id);
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await userService.findById('test-user-id');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(userService.findById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      });
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await userService.findByEmail('john.doe@example.com');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'john.doe@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await userService.findByEmail('nonexistent@example.com');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update and return the user', async () => {
      const updateUserDto: UpdateUserDto = {
        firstName: 'Updated',
        lastName: 'User',
      };

      const updatedUser = {
        ...mockUser,
        firstName: 'Updated',
        lastName: 'User',
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(updatedUser);

      const result = await userService.update('test-user-id', updateUserDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
      });
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when user is not found', async () => {
      const updateUserDto: UpdateUserDto = {
        firstName: 'Updated',
        lastName: 'User',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(
        userService.update('non-existent-id', updateUserDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft remove the user', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await userService.remove('test-user-id');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
      });
      expect(userRepository.softRemove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException when user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(userService.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // Additional tests for other methods like updatePassword, setVerified, etc.
});
