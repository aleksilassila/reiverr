import { Module } from '@nestjs/common';
import { SettingsModule } from 'src/settings/settings.module';
import { PluginsService } from './plugins.service';

@Module({
  imports: [SettingsModule],
  providers: [PluginsService],
  exports: [PluginsService],
})
export class PluginsModule {}
