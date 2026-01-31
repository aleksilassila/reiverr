import { Module } from '@nestjs/common';
import { settingsProviders } from './settings.providers';
import { SettingsService } from './settings.service';

@Module({
  providers: [...settingsProviders, SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
