import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
    private readonly logger = new Logger(HealthService.name);

    constructor(private prisma: PrismaService) { }

    async checkDatabase(): Promise<boolean> {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            this.logger.log('Health check: Success, Server is available');
            return true;
        } catch (error) {
            this.logger.error(`Health check: Error, Server is not available now`, error);
            return false;
        }
    }
}
