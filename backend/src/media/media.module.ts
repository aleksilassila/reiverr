import { Module } from '@nestjs/common';
import { mediaPluginClientsProvider } from './media-plugin-clients.provider';
import { MediaPluginsService } from './media-plugins.service';
import { MediaController } from './media.controller';
import { PluginsModule } from 'src/plugins/plugins.module';

@Module({
  imports: [PluginsModule],
  controllers: [MediaController],
  providers: [mediaPluginClientsProvider, MediaPluginsService],
  exports: [MediaPluginsService],
})
export class MediaModule {}
