import { Module } from '@nestjs/common';
import { MediaController } from './media.controller.js';
import { PluginsModule } from '../plugins/plugins.module.js';
import { MetadataModule } from '../metadata/metadata.module.js';

@Module({
  imports: [PluginsModule, MetadataModule],
  controllers: [MediaController],
  providers: [],
  exports: [],
})
export class MediaModule {}
