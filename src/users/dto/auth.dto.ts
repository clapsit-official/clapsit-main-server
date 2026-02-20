import { IsEmail, IsNotEmpty, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class SignupDto {
    @IsEmail({}, { message: 'INVALID_EMAIL' })
    @IsNotEmpty({ message: 'USER_REGISTRATION_FAILED' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'USER_REGISTRATION_FAILED' })
    fullname: string;

    @IsString()
    @IsNotEmpty({ message: 'USER_REGISTRATION_FAILED' })
    @MinLength(6, { message: 'INVALID_PASSWORD' })
    password: string;

    @IsString()
    @IsOptional()
    preferred_lang?: string;
}

export class LoginDto {
    @IsEmail({}, { message: 'INVALID_EMAIL' })
    @IsNotEmpty({ message: 'USER_LOGIN_PROGRESS_FAILED' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'USER_LOGIN_PROGRESS_FAILED' })
    password: string;
}

export class ForgotPasswordDto {
    @IsEmail({}, { message: 'INVALID_EMAIL' })
    @IsNotEmpty({ message: 'SOMETHING_WENT_WRONG' })
    email: string;
}

export class ResetPasswordDto {
    @IsString()
    @IsNotEmpty({ message: 'SOMETHING_WENT_WRONG' })
    token: string;

    @IsString()
    @IsNotEmpty({ message: 'SOMETHING_WENT_WRONG' })
    @MinLength(6, { message: 'INVALID_PASSWORD' })
    new_password: string;
}
