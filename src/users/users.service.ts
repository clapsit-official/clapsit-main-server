import { ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService, tokenLifeHours } from '../auth/auth.service';
import { SmtpService } from '../smtp/smtp.service';
import { ForgotPasswordDto, LoginDto, ResetPasswordDto, SignupDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import moment = require('moment');

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        private prisma: PrismaService,
        private authService: AuthService,
        private smtpService: SmtpService,
    ) { }

    async signup(payload: SignupDto) {
        const emailExist = await this.prisma.users.findUnique({
            where: { email: payload.email },
        });

        if (emailExist) {
            throw new ConflictException('EMAIL_IS_EXIST');
        }

        const hashPassword = await bcrypt.hash(
            payload.password,
            Number(process.env.HASH_LIMIT) || 10,
        );

        try {
            const user = await this.prisma.users.create({
                data: {
                    fullname: payload.fullname,
                    email: payload.email,
                    password: hashPassword,
                    register_date: moment().format('DD.MM.YYYY:HH:mm:ss'),
                    UserDetails: {
                        create: {
                            email_registered: false,
                            preferred_lang: payload.preferred_lang || 'en',
                        },
                    },
                },
            });

            const { token } = await this.authService.createSessionToken(user.id, 'confirm_email', { email: user.email });

            const appDomain = process.env.APP_BRAND_DOMAIN || 'localhost';
            const confirmLink = `https://www.${appDomain.toLowerCase()}/confirm_email?token=${token}`;

            const emailHandler = await this.smtpService.sendEmailByUserId(user.id, 'noreply');
            await emailHandler.confirmEmail({
                confirm_link: confirmLink,
                confirm_link_life_hour: tokenLifeHours.confirm_email,
            });

            this.logger.log(`🛎️ NEW USER REGISTERED "${user.fullname} | ${user.email}"`);

            return {
                success: true,
                message: 'USER_SUCCESSFULLY_REGISTERED',
                data: { count: user.id },
            };
        } catch (error) {
            this.logger.error(`Registration failed: ${error}`);
            throw new InternalServerErrorException('USER_REGISTRATION_FAILED');
        }
    }

    async login(payload: LoginDto) {
        const user = await this.prisma.users.findUnique({
            where: { email: payload.email },
        });

        if (!user || !user.id) {
            throw new UnauthorizedException('EMAIL_OR_PASSWORD_INCORRECT');
        }

        const isMatch = await bcrypt.compare(payload.password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('EMAIL_OR_PASSWORD_INCORRECT');
        }

        const accessTokenObj = await this.authService.createSessionToken(user.id, 'access_token', { user_id: user.id });
        const refreshTokenObj = await this.authService.createSessionToken(user.id, 'refresh_token', {
            user_id: user.id,
            access_token_session: accessTokenObj.session_id,
        });

        this.logger.log(`NEW LOGIN FROM USER_ID: ${user.id}`);

        return {
            success: true,
            data: {
                access_token: accessTokenObj.token,
                refresh_token: refreshTokenObj.token,
                expires_in: accessTokenObj.expired_in,
            },
            message: 'USER_SUCCESSFULLY_LOGIN',
        };
    }

    async forgotPassword(payload: ForgotPasswordDto) {
        const user = await this.prisma.users.findUnique({
            where: { email: payload.email },
            include: { UserDetails: true },
        });

        if (!user || !user.UserDetails) {
            return { success: true, message: 'PASSWORD_RESET_LINK_WILL_SENT' };
        }

        const { token } = await this.authService.createSessionToken(user.id, 'reset_password', {
            key: user.password,
        });

        const appDomain = process.env.APP_BRAND_DOMAIN || 'localhost';
        const resetLink = `https://www.${appDomain.toLowerCase()}/reset_password?token=${token}`;

        try {
            const emailHandler = await this.smtpService.sendEmailByUserId(user.id, 'noreply');
            await emailHandler.resetPassword({
                reset_link: resetLink,
                reset_link_life_hour: tokenLifeHours.reset_password,
            });
            this.logger.log(`🔑 Reset password request for email -> ${payload.email}`);
        } catch (error) {
            this.logger.error(`Error sending forgot password email: ${error}`);
        }

        return { success: true, message: 'PASSWORD_RESET_LINK_WILL_SENT' };
    }

    async resetPassword(payload: ResetPasswordDto, ip: string = '', userAgent: any = {}) {
        const result = await this.authService.verifySessionToken('reset_password', payload.token);
        const sessionPayload: any = result.payload;
        const session = result.session;

        const user = await this.prisma.users.findFirst({
            where: { password: sessionPayload.key, id: session.owner_id },
        });

        if (!user) {
            throw new NotFoundException('User cannot found at this moment');
        }

        const hashPassword = await bcrypt.hash(payload.new_password, Number(process.env.HASH_LIMIT) || 10);

        await this.prisma.users.update({
            where: { id: user.id },
            data: { password: hashPassword },
        });

        this.logger.log(`🔐 Password changed for -> email: ${user.email}`);

        try {
            const emailHandler = await this.smtpService.sendEmailByUserId(user.id, 'noreply');
            await emailHandler.passwordUpdated({
                update_date: moment().format('YYYY-MM-DD HH:mm:ss'),
                browser: userAgent?.browser || '--',
                os: userAgent?.os || '--',
                platform: userAgent?.platform || '--',
            });
        } catch (error) {
            this.logger.error(`Failed sending password updated email: ${error}`);
        }

        await this.authService.killSession(session.id);
        return { success: true, message: 'PASSWORD_SUCCESSFULLY_CHANGED' };
    }
}
