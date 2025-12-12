import { Module } from '@nestjs/common';
import { mediaPluginClientsProvider } from './media-plugin-clients.provider';
import { MediaPluginsService } from './media-plugins.service';
import { MediaController } from './media.controller';

@Module({
  imports: [],
  controllers: [MediaController],
  providers: [mediaPluginClientsProvider, MediaPluginsService],
  exports: [MediaPluginsService],
})
export class MediaModule {}
