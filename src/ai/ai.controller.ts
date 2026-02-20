import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AskQuestionDto, SaveHistoryDto, SaveKeyDto } from './dto/ai.dto';
import type { Request } from 'express';

@Controller('aim')
@UseGuards(AuthGuard)
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Get('start')
    start(@Query('key_name') keyName: string, @Req() req: Request) {
        const userId = (req as any).user.id;
        return this.aiService.startConversation(userId, keyName);
    }

    @Get('user_keys')
    getKeysByUserId(@Req() req: Request) {
        const userId = (req as any).user.id;
        return this.aiService.getKeysByUserId(userId);
    }

    @Get('key_history')
    getHistoryByKeyId(@Query('key_id') keyId: number, @Req() req: Request) {
        const userId = (req as any).user.id;
        return this.aiService.getHistoryByKeyId(userId, Number(keyId));
    }

    @Get('key_history/saved')
    getUserSavedHistories(@Req() req: Request) {
        const userId = (req as any).user.id;
        return this.aiService.getUserSavedHistories(userId);
    }

    @Get('key_history/recently')
    getUserRecentlyHistories(@Req() req: Request) {
        const userId = (req as any).user.id;
        return this.aiService.getUserRecentlyHistories(userId);
    }

    @Patch('user_keys/:key_id')
    saveKeyById(@Param('key_id') keyId: number, @Body() body: SaveKeyDto, @Req() req: Request) {
        const userId = (req as any).user.id;
        return this.aiService.saveKeyById(userId, Number(keyId), body.data.save);
    }

    @Delete('user_keys/:key_id')
    deleteKeyById(@Param('key_id') keyId: number, @Req() req: Request) {
        const userId = (req as any).user.id;
        return this.aiService.deleteKeyById(userId, Number(keyId));
    }

    @Delete('user_keys')
    deleteAllKeysByUserId(@Req() req: Request) {
        const userId = (req as any).user.id;
        return this.aiService.deleteAllKeysByUserId(userId);
    }

    @Patch('key_history/:conversation_id')
    saveHistoryByConversationId(@Param('conversation_id') convId: number, @Body() body: SaveHistoryDto, @Req() req: Request) {
        const userId = (req as any).user.id;
        return this.aiService.saveHistoryByConversationId(userId, Number(convId), body.data.save);
    }

    @Delete('key_history/:conversation_id')
    deleteHistoryByConversationId(@Param('conversation_id') convId: number, @Req() req: Request) {
        const userId = (req as any).user.id;
        return this.aiService.deleteHistoryByConversationId(userId, Number(convId));
    }

    @Post('ask')
    ask(
        @Query('conversation_key') convKey: string,
        @Query('key_name') keyName: string,
        @Body() body: AskQuestionDto,
        @Req() req: Request
    ) {
        const userId = (req as any).user.id;
        return this.aiService.askQuestion(userId, convKey, keyName, body);
    }

    @Get('json_generator/:c_id')
    getJsonGeneratorById(@Param('c_id') cId: number) {
        return this.aiService.getJsonGeneratorById(Number(cId));
    }

    @Post('json_generator/:cKey')
    createJsonGenerator(@Param('cKey') cKey: string, @Body() body: any) {
        return this.aiService.createJsonGenerator(cKey, body.data);
    }
}
