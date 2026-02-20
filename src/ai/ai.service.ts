import { Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Chatbot from '../assets/helpers/chatBot';
import aiPresets, { definationExamples, presets } from '../assets/constants/aiPresets';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private availableModels: string[] = ['chatgpt', 'deep_seek', 'grok'];
    private availableKeys: string[] = Object.keys(presets);
    private modelGrok: Chatbot;
    private modelDeepSeek: Chatbot;
    private modelChatGPT: Chatbot;

    constructor(private prisma: PrismaService) {
        this.modelGrok = new Chatbot({
            baseURL: process.env.GROK_BASE_URL,
            apiKey: process.env.GROK_API_KEY || 'dummy_key',
            model: 'grok-2-vision-1212',
        });
        this.modelDeepSeek = new Chatbot({
            baseURL: process.env.DEEPSEEK_BASE_URL,
            apiKey: process.env.DEEPSEEK_API_KEY || 'dummy_key',
            model: 'deepseek-chat',
        });
        this.modelChatGPT = new Chatbot({
            baseURL: null, // default OpenAI base
            apiKey: process.env.CHATGPT_API_KEY || 'dummy_key',
            model: 'gpt-4o',
        });
    }

    async getKeysByUserId(userId: number) {
        const result = await this.prisma.aIConversationKeys.findMany({
            where: { user_id: userId },
            include: { AIConversationHistory: true },
        });

        const filtered = result.filter(
            (item, index) => item.AIConversationHistory.length > 1 || index === result.length - 1
        );

        const formattedData = filtered.map(item => {
            let label = null;
            const targetHistory = item.AIConversationHistory[item.AIConversationHistory.length - 1];
            if (targetHistory?.question) {
                try {
                    const parsed = JSON.parse(targetHistory.question);
                    if (parsed && typeof parsed === 'object') {
                        const val: any = Object.values(parsed)[0];
                        label = val?.message || val?.input || val;
                    }
                } catch {
                    label = null;
                }
            }

            return {
                label,
                id: item.id,
                c_key: item.conversation_key,
                save: item.saved,
                date: item.created_at,
                key_name: item.key_name,
            };
        }).reverse();

        return { success: true, message: 'DONE', data: formattedData };
    }

    async saveKeyById(userId: number, keyId: number, save: boolean) {
        try {
            const result = await this.prisma.aIConversationKeys.update({
                where: { id: keyId },
                data: { saved: save },
            });
            return { success: true, message: 'DONE', data: { saved: result.saved } };
        } catch {
            throw new NotFoundException('KEY_NOT_FOUND');
        }
    }

    async deleteKeyById(userId: number, keyId: number) {
        try {
            const result = await this.prisma.aIConversationKeys.delete({
                where: { id: keyId },
            });
            return { success: true, message: 'DONE', data: { deleted: result.id } };
        } catch {
            throw new NotFoundException('KEY_NOT_FOUND');
        }
    }

    async deleteAllKeysByUserId(userId: number) {
        const result = await this.prisma.aIConversationKeys.deleteMany({
            where: { user_id: userId },
        });
        return { success: true, message: 'DONE', data: { deleted: result.count } };
    }

    async getHistoryByKeyId(userId: number, keyId: number) {
        const result = await this.prisma.aIConversationKeys.findFirst({
            where: { id: keyId, user_id: userId },
            include: { AIConversationHistory: true },
        });

        if (!result) return { success: true, message: 'DONE', data: [] };

        let data = result.AIConversationHistory.map(item => ({
            c_id: item.conversation_id,
            c_key: item.conversation_key,
            input: definationExamples.default.resolver({ role: 'user', content: item.question }),
            output: definationExamples.default.resolver({ role: 'assistant', content: item.response }),
            save: item.saved,
            date: item.created_at,
            key_name: result.key_name,
        }));

        data.shift(); // Remove initial pre-informing prompt
        return { success: true, message: 'DONE', data: data.reverse() };
    }

    async getUserSavedHistories(userId: number) {
        const conversationKeys = await this.prisma.aIConversationKeys.findMany({
            where: { user_id: userId },
            select: { conversation_key: true },
        });
        const keyValues = conversationKeys.map(k => k.conversation_key);

        const savedHistories = await this.prisma.aIConversationHistory.findMany({
            where: { conversation_key: { in: keyValues }, saved: true },
        });

        const data = savedHistories.map(item => ({
            c_id: item.conversation_id,
            c_key: item.conversation_key,
            input: definationExamples.default.resolver({ role: 'user', content: item.question }),
            output: definationExamples.default.resolver({ role: 'assistant', content: item.response }),
            save: item.saved,
            date: item.created_at,
        })).reverse();

        return { success: true, message: 'DONE', data };
    }

    async getUserRecentlyHistories(userId: number) {
        const conversationKeys = await this.prisma.aIConversationKeys.findMany({
            where: { user_id: userId },
            select: { conversation_key: true, AIConversationHistory: true },
        });

        const filteredKeys = conversationKeys.filter(k => k.AIConversationHistory.length > 1);
        const keyValues = filteredKeys.map(k => k.conversation_key);

        const savedHistories = await this.prisma.aIConversationHistory.findMany({
            where: { conversation_key: { in: keyValues }, pre_informing: false },
            orderBy: { conversation_id: 'desc' },
            take: 10,
        });

        const data = savedHistories.map(item => ({
            c_id: item.conversation_id,
            c_key: item.conversation_key,
            input: definationExamples.default.resolver({ role: 'user', content: item.question }),
            output: definationExamples.default.resolver({ role: 'assistant', content: item.response }),
            save: item.saved,
            date: item.created_at,
        }));

        return { success: true, message: 'DONE', data };
    }

    async saveHistoryByConversationId(userId: number, conversationId: number, save: boolean) {
        try {
            const result = await this.prisma.aIConversationHistory.update({
                where: { conversation_id: conversationId },
                data: { saved: save },
            });
            return { success: true, message: 'DONE', data: { saved: result.saved } };
        } catch {
            throw new NotFoundException('KEY_NOT_FOUND');
        }
    }

    async deleteHistoryByConversationId(userId: number, conversationId: number) {
        try {
            const result = await this.prisma.aIConversationHistory.delete({
                where: { conversation_id: conversationId },
            });
            return { success: true, message: 'DONE', data: { deleted: result.conversation_id } };
        } catch {
            throw new NotFoundException('KEY_NOT_FOUND');
        }
    }

    async startConversation(userId: number, keyName: string) {
        if (!this.availableKeys.includes(keyName)) {
            throw new UnprocessableEntityException('INVALID_KEY_NAME');
        }

        const user = await this.prisma.users.findUnique({
            where: { id: userId },
            include: { UserDetails: true },
        });

        if (!user) {
            throw new NotFoundException('USER_NOT_FOUND');
        }

        const preset = aiPresets(keyName as any)(user.fullname, user.UserDetails?.preferred_lang);

        let conversationKey = await bcrypt.hash(
            [userId, preset.model, keyName, process.env.APP_BRAND_NAME?.toLowerCase()].join('-'),
            10
        );
        conversationKey = conversationKey.split('$2b$10$')[1].split('/').join('$');

        const created = await this.prisma.aIConversationKeys.create({
            data: {
                user_id: userId,
                key_name: keyName,
                conversation_key: conversationKey,
                model: preset.model,
                topic: preset.topic,
            },
        });

        await this.prisma.aIConversationHistory.create({
            data: {
                conversation_key: conversationKey,
                question: preset.topic,
                response: definationExamples.default.okay_response(),
                pre_informing: true,
            },
        });

        return {
            success: true,
            message: 'DONE',
            data: {
                result: {
                    conversation_key: conversationKey,
                    created_at: created.created_at,
                },
            },
        };
    }

    async askQuestion(userId: number, conversationKey: string, keyName: string, data: any) {
        const conversation = await this.prisma.aIConversationKeys.findUnique({
            where: {
                user_id: userId,
                conversation_key: conversationKey,
                key_name: keyName,
            },
            include: { Users: true },
        });

        if (!conversation) {
            throw new UnprocessableEntityException('INVALID_CONVERSATION_KEY');
        }

        if (!this.availableModels.includes(conversation.model)) {
            throw new UnprocessableEntityException('MODEL_IS_UNSUPPORTED');
        }

        const questionStr = JSON.stringify(data.value);
        if (!questionStr) {
            throw new UnprocessableEntityException('VALUE_REQUIRED');
        }

        // Load history (first and last rows) to save tokens
        const allHistory = await this.prisma.aIConversationHistory.findMany({
            where: { conversation_key: conversationKey },
            orderBy: { conversation_id: 'asc' },
        });

        const tokenOptimizedHistory = allHistory.length > 3
            ? [allHistory[0], ...allHistory.slice(-2)]
            : allHistory;

        const chatRecord = await this.prisma.aIConversationHistory.create({
            data: {
                question: questionStr,
                response: '',
                conversation_key: conversationKey,
            },
        });

        let assistantReply = '';
        try {
            // Mock formatting history to ChatBot messages format
            let formattedMessages = tokenOptimizedHistory.reduce((acc: any[], item) => {
                acc.push({ role: 'user', content: item.question });
                if (item.response) acc.push({ role: 'assistant', content: item.response });
                return acc;
            }, []);

            formattedMessages.push({ role: 'user', content: questionStr });

            if (conversation.model === 'chatgpt') {
                this.modelChatGPT.conversationHistory = formattedMessages;
                assistantReply = await this.modelChatGPT.sendMessage(questionStr);
            } else if (conversation.model === 'deep_seek') {
                this.modelDeepSeek.conversationHistory = formattedMessages;
                assistantReply = await this.modelDeepSeek.sendMessage(questionStr);
            } else if (conversation.model === 'grok') {
                this.modelGrok.conversationHistory = formattedMessages;
                assistantReply = await this.modelGrok.sendMessage(questionStr);
            }
        } catch (e) {
            this.logger.error(`Generation error: ${e.message}`);
            assistantReply = `[System Error]: Could not reach AI Backend (${e.message})`;
        }

        await this.prisma.aIConversationHistory.update({
            where: { conversation_id: chatRecord.conversation_id },
            data: { response: assistantReply },
        });

        // Formatting return response (mocked based on old array pop/push logic)
        const reversedHistory = [
            { role: 'assistant', content: assistantReply },
            { role: 'user', content: questionStr },
        ];

        return { success: true, message: 'DONE', data: reversedHistory };
    }

    async getJsonGeneratorById(cId: number) {
        const result = await this.prisma.aIJSONGenerator.findMany({
            where: { conversation_id: cId },
        });
        return { success: true, message: 'DONE', data: result };
    }

    async createJsonGenerator(cKey: string, data: any) {
        const result = await this.prisma.aIJSONGenerator.create({
            data: {
                conversation_key: cKey,
                payload: JSON.stringify(data),
            },
        });
        return { success: true, message: 'DONE', data: result };
    }
}
