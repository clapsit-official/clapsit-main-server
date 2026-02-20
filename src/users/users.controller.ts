import { Body, Controller, Post, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { ForgotPasswordDto, LoginDto, ResetPasswordDto, SignupDto } from './dto/auth.dto';
import type { Request } from 'express';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post('signup')
    signup(@Body() payload: SignupDto) {
        return this.usersService.signup(payload);
    }

    @Post('login')
    login(@Body() payload: LoginDto) {
        return this.usersService.login(payload);
    }

    @Post('forgot_password')
    forgotPassword(@Body() payload: ForgotPasswordDto) {
        return this.usersService.forgotPassword(payload);
    }

    @Post('reset_password')
    resetPassword(@Body() payload: ResetPasswordDto, @Req() req: Request) {
        // In NestJS, useragent can be extracted via libraries or headers, passed in as placeholder
        return this.usersService.resetPassword(payload, req.ip, { browser: 'unknown' });
    }
}
