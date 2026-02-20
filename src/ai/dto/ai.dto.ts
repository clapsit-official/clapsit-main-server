import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class StartConversationDto {
    @IsString()
    @IsNotEmpty()
    key_name: string;
}

export class AskQuestionDto {
    @IsNotEmpty()
    value: any;
}

export class GenerateJsonDto {
    @IsString()
    @IsNotEmpty()
    topic: string;
}

export class TranslateDto {
    @IsString()
    @IsNotEmpty()
    text: string;

    @IsString()
    @IsNotEmpty()
    lang: string;
}

export class SaveHistoryDto {
    @IsBoolean()
    @IsNotEmpty()
    save: boolean;
}

export class SaveKeyDto {
    @IsBoolean()
    @IsNotEmpty()
    save: boolean;
}
