import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module.js';
import { ServerLogController } from './server-log.controller.js';
import { ServerLogService } from './server-log.service.js';

@Module({
  imports: [SettingsModule],
  controllers: [ServerLogController],
  providers: [ServerLogService],
  exports: [ServerLogService],
})
export class ServerLogModule {}
