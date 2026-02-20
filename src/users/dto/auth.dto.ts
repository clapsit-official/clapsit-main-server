import { IsEmail, IsNotEmpty, IsObject, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SignupFields {
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
    preferred_lang?: string;
}

export class SignupDto {
    @IsObject()
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => SignupFields)
    data: SignupFields;
}

export class LoginFields {
    @IsEmail({}, { message: 'INVALID_EMAIL' })
    @IsNotEmpty({ message: 'USER_LOGIN_PROGRESS_FAILED' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'USER_LOGIN_PROGRESS_FAILED' })
    password: string;
}

export class LoginDto {
    @IsObject()
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => LoginFields)
    data: LoginFields;
}

export class ForgotPasswordFields {
    @IsEmail({}, { message: 'INVALID_EMAIL' })
    @IsNotEmpty({ message: 'SOMETHING_WENT_WRONG' })
    email: string;
}

export class ForgotPasswordDto {
    @IsObject()
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => ForgotPasswordFields)
    data: ForgotPasswordFields;
}

export class ResetPasswordFields {
    @IsString()
    @IsNotEmpty({ message: 'SOMETHING_WENT_WRONG' })
    token: string;

    @IsString()
    @IsNotEmpty({ message: 'SOMETHING_WENT_WRONG' })
    @MinLength(6, { message: 'INVALID_PASSWORD' })
    new_password: string;
}

export class ResetPasswordDto {
    @IsObject()
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => ResetPasswordFields)
    data: ResetPasswordFields;
}
