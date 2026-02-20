import { Controller, Get, Post, Put, Delete, Param, Body, Res, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { CdnService } from './cdn.service';
import * as path from 'path';

// Note: To handle actual multipart/form-data properly, NestJS has `FileInterceptor` from `@nestjs/platform-express`.
// The original `BaseUploadController` implies it handles upload logic, but doesn't show multer usage natively in the class,
// implying it was handled by routing middleware before hitting the controller.
// We will outline the structural equivalent here.

@Controller('cdn')
export class CdnController {
    constructor(private readonly cdnService: CdnService) { }

    @Get(':id')
    async findObject(@Param('id') id: string, @Res() res: Response) {
        if (!id) {
            throw new HttpException('PARAM_REQUIRED', HttpStatus.BAD_REQUEST);
        }

        const objectPath = await this.cdnService.getObjectPath(id);

        if (!objectPath) {
            throw new HttpException('OBJECT_NOT_FOUND', HttpStatus.NOT_FOUND);
        }

        // Attempting to send file
        try {
            res.sendFile(path.resolve(objectPath));
        } catch (error) {
            throw new HttpException('OBJECT_NOT_FOUND', HttpStatus.NOT_FOUND);
        }
    }
}
