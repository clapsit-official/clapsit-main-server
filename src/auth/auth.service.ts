import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import moment from 'moment';

type CreatedForTypes = 'access_token' | 'refresh_token' | 'confirm_email' | 'reset_password';

export const tokenLifeDays = {
    default: 1 / 24,
    confirm_email: 1,
    access_token: 7,
    refresh_token: 30,
    reset_password: 1 / 24,
};

const dayBySeconds = (day: number) => 3600 * 24 * day;

export const tokenLifeSeconds = {
    default: dayBySeconds(tokenLifeDays.default),
    confirm_email: dayBySeconds(tokenLifeDays.confirm_email),
    access_token: dayBySeconds(tokenLifeDays.access_token),
    refresh_token: dayBySeconds(tokenLifeDays.refresh_token),
    reset_password: dayBySeconds(tokenLifeDays.reset_password),
};

export const tokenLifeHours = {
    default: 24 * tokenLifeDays.default,
    confirm_email: 24 * tokenLifeDays.confirm_email,
    access_token: 24 * tokenLifeDays.access_token,
    refresh_token: 24 * tokenLifeDays.refresh_token,
    reset_password: 24 * tokenLifeDays.reset_password,
};

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    private getSecretKey(createdFor: CreatedForTypes | 'default'): string {
        const defaultSecret = 'undefined_secret_key';
        const secrets = {
            default: process.env.ACCESS_TOKEN_SECRET || defaultSecret,
            access_token: process.env.ACCESS_TOKEN_SECRET || defaultSecret,
            confirm_email: process.env.ACCESS_TOKEN_SECRET || defaultSecret,
            refresh_token: process.env.REFRESH_TOKEN_SECRET || defaultSecret,
            reset_password: process.env.ACCESS_TOKEN_SECRET || defaultSecret,
        };
        return secrets[createdFor];
    }

    isDateExpired(date: string | Date): boolean {
        return moment(date).isBefore(moment());
    }

    async createSessionToken(ownerId: number, createdFor: CreatedForTypes, payload: any = {}) {
        const expiresIn = tokenLifeSeconds[createdFor] || tokenLifeSeconds.default;
        const expiredIn = moment().add(expiresIn, 'seconds').format();

        try {
            const token = this.jwtService.sign(payload, {
                secret: this.getSecretKey(createdFor),
                expiresIn,
            });

            const existSession = await this.prisma.tokenSessions.findFirst({
                where: { owner_id: ownerId, created_for: createdFor },
            });

            const result = await this.prisma.tokenSessions.upsert({
                where: { id: existSession?.id || 0 },
                update: { token, payload, expired_in: expiredIn },
                create: {
                    owner_id: ownerId,
                    created_for: createdFor,
                    payload,
                    expired_in: expiredIn,
                    token,
                },
            });

            this.logger.log(`New token session created for "${createdFor}", (owner_id: ${ownerId})`);

            return {
                session_id: result.id,
                token,
                expired_in: expiredIn,
            };
        } catch (error) {
            this.logger.error(`Error creating session: ${error}`);
            throw error;
        }
    }

    async verifySessionToken(createdFor: CreatedForTypes, token: string) {
        try {
            const session = await this.prisma.tokenSessions.findFirst({
                where: { created_for: createdFor, token },
            });

            if (!session) {
                throw new UnauthorizedException('Invalid session token');
            }

            const owner = await this.prisma.users.findUnique({
                where: { id: session.owner_id },
            });

            if (this.isDateExpired(session.expired_in)) {
                await this.killSession(session.id);
                throw new UnauthorizedException('Session token expired');
            } else if (!owner) {
                await this.killSession(session.id);
                throw new UnauthorizedException('Cannot find owner of session');
            }

            const payload = this.jwtService.verify(token, {
                secret: this.getSecretKey(createdFor),
            });

            return { session, payload, owner };
        } catch (error) {
            this.logger.error(`Token Verification Error: ${error}`);
            throw new UnauthorizedException(error.message);
        }
    }

    async killSession(sessionId: number) {
        try {
            const result = await this.prisma.tokenSessions.findUnique({
                where: { id: sessionId },
            });

            if (result) {
                await this.prisma.tokenSessions.delete({
                    where: { id: sessionId },
                });
                this.logger.log(`Session killed: ${sessionId}`);
            }
        } catch (error) {
            this.logger.error(`Error killing session: ${error}`);
        }
    }

    async dropAllExpiredSessions() {
        try {
            const sessions = await this.prisma.tokenSessions.findMany();
            let droppedCount = 0;

            for (const session of sessions) {
                if (this.isDateExpired(session.expired_in)) {
                    await this.killSession(session.id);
                    droppedCount++;
                }
            }

            this.logger.log(`Dropped ${droppedCount} expired sessions.`);
        } catch (error) {
            this.logger.error(`Error dropping expired sessions: ${error}`);
        }
    }
}
