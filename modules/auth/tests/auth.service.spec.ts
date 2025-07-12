import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { UserService } from '../../user/user.service';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '../../../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

// Mock dependencies
jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUser = {
    id: 'test-user-id',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'hashedPassword',
    role: UserRole.CUSTOMER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'Password123!',
      passwordConfirmation: 'Password123!',
    };

    it('should throw if passwords do not match', async () => {
      await expect(
        authService.register({
          ...registerDto,
          passwordConfirmation: 'DifferentPassword',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw if email already exists', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.register(registerDto)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
    });

    it('should create a new user with hashed password', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      await authService.register(registerDto);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockUserService.create).toHaveBeenCalledWith({
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        email: registerDto.email,
        password: 'hashedPassword',
        role: UserRole.CUSTOMER,
      });
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'john.doe@example.com',
      password: 'Password123!',
    };

    it('should throw if user is not found', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(loginDto.email);
    });

    it('should throw if password is invalid', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
    });

    it('should generate and return tokens if credentials are valid', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockImplementation((payload, options) => {
        if (options.secret === 'access-secret') {
          return Promise.resolve('access-token');
        }
        return Promise.resolve('refresh-token');
      });
      mockConfigService.get.mockImplementation((key) => {
        const config = {
          'auth.jwt.secret': 'access-secret',
          'auth.jwt.expiresIn': 3600,
          'auth.jwt.refreshSecret': 'refresh-secret',
          'auth.jwt.refreshExpiresIn': 604800,
        };
        return config[key];
      });

      const result = await authService.login(loginDto);

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
      });
    });
  });

  describe('refreshTokens', () => {
    const refreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should throw if token verification fails', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Token verification failed');
      });

      await expect(authService.refreshTokens(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw if user is not found', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'non-existent-user-id' });
      mockUserService.findById.mockResolvedValue(null);

      await expect(authService.refreshTokens(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should generate and return new tokens if refresh token is valid', async () => {
      mockJwtService.verify.mockReturnValue({ sub: mockUser.id });
      mockUserService.findById.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockImplementation((payload, options) => {
        if (options.secret === 'access-secret') {
          return Promise.resolve('new-access-token');
        }
        return Promise.resolve('new-refresh-token');
      });
      mockConfigService.get.mockImplementation((key) => {
        const config = {
          'auth.jwt.secret': 'access-secret',
          'auth.jwt.expiresIn': 3600,
          'auth.jwt.refreshSecret': 'refresh-secret',
          'auth.jwt.refreshExpiresIn': 604800,
        };
        return config[key];
      });

      const result = await authService.refreshTokens(refreshTokenDto);

      expect(mockJwtService.verify).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken,
        { secret: 'refresh-secret' },
      );
      expect(mockUserService.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
      });
    });
  });
});
