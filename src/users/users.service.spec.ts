import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { SmtpService } from '../smtp/smtp.service';
import * as bcrypt from 'bcrypt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;
  let authService: AuthService;
  let smtpService: SmtpService;

  const mockPrismaService = {
    users: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    userDetails: {
      create: jest.fn(),
    },
  };

  const mockAuthService = {
    createSessionToken: jest.fn(),
    verifySessionToken: jest.fn(),
    killSession: jest.fn(),
  };

  const mockSmtpService = {
    sendEmailByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: SmtpService,
          useValue: mockSmtpService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    authService = module.get<AuthService>(AuthService);
    smtpService = module.get<SmtpService>(SmtpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    it('should register a new user successfully', async () => {
      const signupDto = { fullname: 'Test User', email: 'test@test.com', password: 'password123' };
      mockPrismaService.users.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      const mockUser = { id: 1, ...signupDto, password: 'hashed_password' };
      mockPrismaService.users.create.mockResolvedValue(mockUser);
      mockAuthService.createSessionToken.mockResolvedValue({ token: 'mock_token' });

      const mockEmailHandler = { confirmEmail: jest.fn() };
      mockSmtpService.sendEmailByUserId.mockResolvedValue(mockEmailHandler);

      const result = await service.signup(signupDto as any);

      expect(result.success).toBe(true);
      expect(mockPrismaService.users.create).toHaveBeenCalled();
      expect(mockEmailHandler.confirmEmail).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({ id: 1 });
      await expect(service.signup({ email: 'existing@test.com' } as any))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginDto = { email: 'test@test.com', password: 'password123' };
      const mockUser = { id: 1, email: 'test@test.com', password: 'hashed_password' };
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockAuthService.createSessionToken.mockImplementation((id, type) => {
        if (type === 'access_token') return { token: 'at', session_id: 1, expired_in: 'date' };
        return { token: 'rt' };
      });

      const result = await service.login(loginDto);

      expect(result.success).toBe(true);
      expect(result.data.access_token).toBe('at');
      expect(result.data.refresh_token).toBe('rt');
    });

    it('should throw UnauthorizedException if password incorrect', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({ id: 1, password: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login({ email: 'test@test.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});
