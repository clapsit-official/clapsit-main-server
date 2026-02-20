import { Module } from '@nestjs/common';
import { CdnController } from './cdn.controller';
import { UploaderController } from './uploader.controller';
import { CdnService } from './cdn.service';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CdnController, UploaderController],
  providers: [CdnService]
})
export class CdnModule { }
