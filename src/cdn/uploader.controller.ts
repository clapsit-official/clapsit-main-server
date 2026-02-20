import { Controller, Post, Delete, Param, Body, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { CdnService } from './cdn.service';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('uploader')
@UseGuards(AuthGuard)
export class UploaderController {
    constructor(private readonly cdnService: CdnService) { }

    @Post('upload')
    async upload(@Body() body: any) {
        const object_id = body.object_id;
        if (!object_id) {
            throw new HttpException({ requiredField: ['file'] }, HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return {
            success: true,
            data: { object_id },
        };
    }

    @Delete('delete/:id')
    async deleteObject(@Param('id') id: string, @Body() body: any) {
        const authResultStr = body.authentication_result;
        if (!authResultStr) {
            throw new HttpException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
        }

        const user_id = typeof authResultStr === 'string' ? JSON.parse(authResultStr).user_id : authResultStr.user_id;

        if (!id) {
            throw new HttpException('PARAM_REQUIRED', HttpStatus.BAD_REQUEST);
        }

        const deleted = await this.cdnService.deleteObjectRecord(id, user_id);

        if (!deleted) {
            throw new HttpException('OBJECT_NOT_FOUND', HttpStatus.NOT_FOUND);
        }

        return { success: true };
    }
}
