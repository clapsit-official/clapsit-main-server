import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import moment from 'moment';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    tokenSessions: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    users: {
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSessionToken', () => {
    it('should create a new session token', async () => {
      const ownerId = 1;
      const createdFor = 'access_token';
      const token = 'mock_token';
      const mockSession = { id: 10, owner_id: ownerId, token };

      mockJwtService.sign.mockReturnValue(token);
      mockPrismaService.tokenSessions.findFirst.mockResolvedValue(null);
      mockPrismaService.tokenSessions.upsert.mockResolvedValue(mockSession);

      const result = await service.createSessionToken(ownerId, createdFor);

      expect(result.token).toBe(token);
      expect(result.session_id).toBe(10);
      expect(mockPrismaService.tokenSessions.upsert).toHaveBeenCalled();
    });
  });

  describe('verifySessionToken', () => {
    it('should verify a valid session token', async () => {
      const token = 'valid_token';
      const mockSession = { id: 1, owner_id: 1, token, expired_in: moment().add(1, 'hour').format() };
      const mockUser = { id: 1, email: 'test@test.com' };
      const mockPayload = { sub: 1 };

      mockPrismaService.tokenSessions.findFirst.mockResolvedValue(mockSession);
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockJwtService.verify.mockReturnValue(mockPayload);

      const result = await service.verifySessionToken('access_token', token);

      expect(result.session).toEqual(mockSession);
      expect(result.owner).toEqual(mockUser);
      expect(result.payload).toEqual(mockPayload);
    });

    it('should throw UnauthorizedException if session not found', async () => {
      mockPrismaService.tokenSessions.findFirst.mockResolvedValue(null);
      await expect(service.verifySessionToken('access_token', 'invalid'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if session expired', async () => {
      const token = 'expired_token';
      const mockSession = { id: 1, owner_id: 1, token, expired_in: moment().subtract(1, 'hour').format() };

      mockPrismaService.tokenSessions.findFirst.mockResolvedValue(mockSession);
      mockPrismaService.tokenSessions.findUnique.mockResolvedValue(mockSession);

      await expect(service.verifySessionToken('access_token', token))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});
