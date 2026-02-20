import { Test, TestingModule } from '@nestjs/testing';
import { CdnService } from './cdn.service';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';

jest.mock('fs');

describe('CdnService', () => {
  let service: CdnService;
  let prisma: PrismaService;

  const mockPrismaService = {
    objects: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CdnService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CdnService>(CdnService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getObjectPath', () => {
    it('should return object path if object exists', async () => {
      const objectId = 'obj-1';
      mockPrismaService.objects.findUnique.mockResolvedValue({ id: objectId, path: 'uploads/test.png' });
      const result = await service.getObjectPath(objectId);
      expect(result).toBe('uploads/test.png');
    });

    it('should return null if object not found', async () => {
      mockPrismaService.objects.findUnique.mockResolvedValue(null);
      const result = await service.getObjectPath('none');
      expect(result).toBeNull();
    });
  });

  describe('deleteFile', () => {
    it('should return true if file exists and unlinked successfully', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);
      const result = service.deleteFile('some/path');
      expect(result).toBe(true);
      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('should return false if file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const result = service.deleteFile('none');
      expect(result).toBe(false);
    });
  });

  describe('deleteObjectRecord', () => {
    it('should delete record and file if object exists and owned by user', async () => {
      const objectId = 'obj-1';
      const userId = 1;
      const mockObject = { id: objectId, user_id: userId, path: 'some/path' };
      mockPrismaService.objects.findUnique.mockResolvedValue(mockObject);
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await service.deleteObjectRecord(objectId, userId);

      expect(result).toBe(true);
      expect(mockPrismaService.objects.delete).toHaveBeenCalledWith({ where: { id: objectId } });
    });

    it('should return false if object not found or not owned by user', async () => {
      mockPrismaService.objects.findUnique.mockResolvedValue(null);
      const result = await service.deleteObjectRecord('none', 1);
      expect(result).toBe(false);
    });
  });
});
