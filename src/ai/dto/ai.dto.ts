import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class StartConversationDto {
    @IsString()
    @IsNotEmpty()
    key_name: string;
}

export class AskQuestionDto {
    @IsNotEmpty()
    data: any; // e.g., { value: 'What is NestJS?' }
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

export class SaveHistoryFields {
    @IsBoolean()
    @IsNotEmpty()
    save: boolean;
}

export class SaveHistoryDto {
    @IsObject()
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => SaveHistoryFields)
    data: SaveHistoryFields;
}

export class SaveKeyFields {
    @IsBoolean()
    @IsNotEmpty()
    save: boolean;
}

export class SaveKeyDto {
    @IsObject()
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => SaveKeyFields)
    data: SaveKeyFields;
}
