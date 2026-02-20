import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import Chatbot from '../assets/helpers/chatBot';
import * as bcrypt from 'bcrypt';
import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';

jest.mock('../assets/helpers/chatBot');
jest.mock('bcrypt');

describe('AiService', () => {
  let service: AiService;
  let prisma: PrismaService;

  const mockPrismaService = {
    aIConversationKeys: {
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    aIConversationHistory: {
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    },
    users: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveKeyById', () => {
    it('should update save status', async () => {
      mockPrismaService.aIConversationKeys.update.mockResolvedValue({ saved: true });
      const result = await service.saveKeyById(1, 10, true);
      expect(result.data.saved).toBe(true);
    });

    it('should throw NotFoundException on error', async () => {
      mockPrismaService.aIConversationKeys.update.mockRejectedValue(new Error());
      await expect(service.saveKeyById(1, 99, true)).rejects.toThrow(NotFoundException);
    });
  });

  describe('startConversation', () => {
    it('should start a new conversation', async () => {
      const userId = 1;
      const keyName = 'json_generator';
      mockPrismaService.users.findUnique.mockResolvedValue({ id: userId, fullname: 'Test', UserDetails: { preferred_lang: 'en' } });
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$mocked_hash_1234567890');
      mockPrismaService.aIConversationKeys.create.mockResolvedValue({ created_at: new Date() });

      const result = await service.startConversation(userId, keyName);

      expect(result.success).toBe(true);
      expect(mockPrismaService.aIConversationKeys.create).toHaveBeenCalled();
    });

    it('should throw UnprocessableEntityException for invalid key', async () => {
      await expect(service.startConversation(1, 'invalid_key')).rejects.toThrow(UnprocessableEntityException);
    });
  });
});
