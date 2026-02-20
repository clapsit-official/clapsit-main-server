import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthService', () => {
    let service: HealthService;
    let prisma: PrismaService;

    const mockPrismaService = {
        $queryRaw: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HealthService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<HealthService>(HealthService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('checkDatabase', () => {
        it('should return true if queryRaw succeeds', async () => {
            mockPrismaService.$queryRaw.mockResolvedValueOnce([{ '1': 1 }]);
            const result = await service.checkDatabase();
            expect(result).toBe(true);
            expect(mockPrismaService.$queryRaw).toHaveBeenCalledWith(['SELECT 1']);
        });

        it('should return false if queryRaw fails', async () => {
            mockPrismaService.$queryRaw.mockRejectedValueOnce(new Error('DB Error'));
            const result = await service.checkDatabase();
            expect(result).toBe(false);
        });
    });
});
