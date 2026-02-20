import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailsCanBe, SMTPAddress } from '../assets/configurations/emailConfigs';
import { getEmailTemplate } from '../assets/helpers/emailHelper';
import { default_email_lang } from '../assets/constants/language';

@Injectable()
export class SmtpService {
    private readonly logger = new Logger(SmtpService.name);
    private appDomain = process.env.APP_BRAND_DOMAIN;
    private companyName = process.env.APP_BRAND_NAME;

    constructor(private prisma: PrismaService) { }

    async sendEmailByUserId(userId: number, withEmail: EmailsCanBe) {
        if (!userId) {
            throw new Error('"user_id" null or undefined!');
        }

        const user = await this.prisma.users.findUnique({
            where: { id: userId },
            include: { UserDetails: true },
        });

        if (user && user.email) {
            return {
                send: async (args: { subject: string; description: string }, content: string) => {
                    if (content && args?.subject && args.description) {
                        return await this.sendEmail(user.email, withEmail, {
                            subject: args.subject,
                            description: args.description,
                            html: content,
                        });
                    }
                },
                resetPassword: async (args: { reset_link: string; reset_link_life_hour: number }) => {
                    const template = await getEmailTemplate(
                        'reset_password',
                        {
                            full_name: user.fullname,
                            company_name: this.companyName,
                            reset_link: args.reset_link,
                            reset_link_life_hour: args.reset_link_life_hour,
                            support_team_email: SMTPAddress.support.email,
                        },
                        user.UserDetails?.preferred_lang || default_email_lang,
                    );
                    await this.sendEmail(user.email, withEmail, {
                        subject: 'Reset Password',
                        description: 'Reset your password with magic link',
                        html: template,
                    });
                },
                confirmEmail: async (args: { confirm_link: string; confirm_link_life_hour: number }) => {
                    const template = await getEmailTemplate(
                        'confirm_email',
                        {
                            company_name: this.companyName,
                            full_name: user.fullname,
                            confirm_link: args.confirm_link,
                            confirm_link_life_hour: args.confirm_link_life_hour,
                            support_team_email: SMTPAddress.support.email,
                        },
                        user.UserDetails?.preferred_lang || default_email_lang,
                    );
                    await this.sendEmail(user.email, withEmail, {
                        subject: 'Confirm Email',
                        description: 'Hello there, welcome to Clapsit. Please Confirm your email address!',
                        html: template,
                    });
                },
                passwordUpdated: async (args: { update_date: string; browser: string; platform: string; os: string }) => {
                    const template = await getEmailTemplate(
                        'password_updated',
                        {
                            support_team_email: SMTPAddress.support.email,
                            company_name: this.companyName,
                            full_name: user.fullname,
                            update_date: args.update_date,
                            browser: args.browser,
                            platform: args.platform,
                            os: args.os,
                        },
                        user.UserDetails?.preferred_lang || default_email_lang,
                    );

                    await this.sendEmail(user.email, withEmail, {
                        subject: 'Password Updated',
                        description: 'Your password been successfully updated!',
                        html: template,
                    });
                },
            };
        } else {
            throw new Error('User email not found')
        }
    }

    private async sendEmail(
        to: string,
        withEmail: EmailsCanBe,
        content: { subject: string; description: string; html: string },
    ) {
        try {
            await SMTPAddress[withEmail].transporter.sendMail({
                to,
                from: `${SMTPAddress[withEmail].label} <${SMTPAddress[withEmail].email}>`,
                subject: content.subject,
                text: content.description,
                html: `<div id="email-body">${content.html}</div>`,
            });
            this.logger.log(`📬 "${content.subject}": {from: "${SMTPAddress[withEmail].email}", to: "${to}"}`);
        } catch (error: any) {
            this.logger.error(`📬 "${content.subject}": Failed to send. {from: "${SMTPAddress[withEmail].email}", to: "${to}"}`, error);
            throw error;
        }
    }
}
