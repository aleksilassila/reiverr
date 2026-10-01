import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module.js';
import { PluginsService } from './plugins.service.js';

@Module({
  imports: [SettingsModule],
  providers: [PluginsService],
  exports: [PluginsService],
})
export class PluginsModule {}
