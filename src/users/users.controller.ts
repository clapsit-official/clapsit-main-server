import { Body, Controller, Delete, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ForgotPasswordDto, LoginDto, ResetPasswordDto, SignupDto } from './dto/auth.dto';
import type { Request } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('user')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @UseGuards(AuthGuard)
    @Get('auth')
    auth(@Req() req: Request) {
        return this.usersService.auth(req);
    }

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

    @UseGuards(AuthGuard)
    @Get('logout')
    logout(@Req() req: Request) {
        return this.usersService.logout(req);
    }

    @Get('confirm_email')
    confirmEmail(@Query('token') token: string) {
        return this.usersService.confirmEmail(token);
    }

    @Get('reset_password')
    checkResetPasswordToken(@Query('token') token: string) {
        return this.usersService.checkResetPasswordToken(token);
    }

    @Post('reset_password')
    resetPassword(@Body() payload: ResetPasswordDto, @Req() req: Request) {
        return this.usersService.resetPassword(payload, req.ip, { browser: 'unknown' });
    }

    @UseGuards(AuthGuard)
    @Patch('preferred_lang')
    setPreferredLang(@Query('user_id') userId: string, @Body() body: { data: { lang: string } }) {
        return this.usersService.setPreferredLang(Number(userId), body.data.lang);
    }
}
