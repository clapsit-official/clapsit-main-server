import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';
import { SmtpModule } from '../smtp/smtp.module';

@Module({
  imports: [AuthModule, SmtpModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule { }
