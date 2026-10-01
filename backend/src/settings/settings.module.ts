import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service.js';

@Module({
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
