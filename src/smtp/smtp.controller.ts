import { Controller, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { SmtpService } from './smtp.service';
import { EmailsCanBe } from '../assets/configurations/emailConfigs';

@Controller('smtp')
export class SmtpController {
    constructor(private readonly smtpService: SmtpService) { }

    // Usually this would be triggered internally via other services,
    // but if you have a test/trigger endpoint for emails, you can place it here.
    // For now, mirroring core capability by exposing a general test route.

    @Post('test/:userId')
    async testEmail(@Param('userId') userId: string, @Body() body: { type: EmailsCanBe, content: string }) {
        try {
            const emailHandler = await this.smtpService.sendEmailByUserId(parseInt(userId, 10), body.type || 'noreply');
            if (emailHandler?.send) {
                await emailHandler.send(
                    { subject: 'NestJS Test Email', description: 'Testing the new nest backend' },
                    body.content || '<h1>Hello From NestJS</h1>'
                );
                return { success: true, message: 'Email sequence fired' };
            }
        } catch (err: any) {
            throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
