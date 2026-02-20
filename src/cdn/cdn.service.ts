import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CdnService {
    private readonly logger = new Logger(CdnService.name);

    constructor(private prisma: PrismaService) { }

    async getObjectPath(objectId: string): Promise<string | null> {
        const object = await this.prisma.objects.findUnique({
            where: { id: objectId },
        });

        if (!object) {
            return null;
        }

        return object.path;
    }

    deleteFile(filePath: string): boolean {
        const absolutePath = path.resolve(filePath);
        if (fs.existsSync(absolutePath)) {
            try {
                fs.unlinkSync(absolutePath);
                return true;
            } catch (err) {
                this.logger.error(`Failed to delete file: ${filePath}`, err);
                return false;
            }
        }
        return false;
    }

    async deleteObjectRecord(objectId: string, userId: number): Promise<boolean> {
        const object = await this.prisma.objects.findUnique({
            where: { id: objectId, user_id: userId },
        });

        if (!object) {
            return false;
        }

        this.deleteFile(object.path);
        await this.prisma.objects.delete({
            where: { id: objectId },
        });

        return true;
    }
}
