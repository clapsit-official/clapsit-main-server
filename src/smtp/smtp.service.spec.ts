import { Test, TestingModule } from '@nestjs/testing';
import { SmtpService } from './smtp.service';
import { PrismaService } from '../prisma/prisma.service';
import { SMTPAddress } from '../assets/configurations/emailConfigs';
import { getEmailTemplate } from '../assets/helpers/emailHelper';

jest.mock('../assets/configurations/emailConfigs', () => ({
  SMTPAddress: {
    noreply: {
      transporter: {
        sendMail: jest.fn(),
      },
      label: 'No Reply',
      email: 'noreply@test.com',
    },
    support: {
      email: 'support@test.com',
    },
  },
}));

jest.mock('../assets/helpers/emailHelper');

describe('SmtpService', () => {
  let service: SmtpService;
  let prisma: PrismaService;

  const mockPrismaService = {
    users: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmtpService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SmtpService>(SmtpService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmailByUserId', () => {
    it('should return email handler for valid user', async () => {
      const userId = 1;
      mockPrismaService.users.findUnique.mockResolvedValue({ id: userId, email: 'test@test.com', fullname: 'Test' });

      const handler = await service.sendEmailByUserId(userId, 'noreply');
      expect(handler).toBeDefined();
      expect(handler.confirmEmail).toBeDefined();
    });

    it('should throw error if user has no email', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({ id: 1, email: null });
      await expect(service.sendEmailByUserId(1, 'noreply')).rejects.toThrow('User email not found');
    });
  });
});
