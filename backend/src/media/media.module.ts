import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { PluginsModule } from 'src/plugins/plugins.module';
import { MetadataModule } from 'src/metadata/metadata.module';

@Module({
  imports: [PluginsModule, MetadataModule],
  controllers: [MediaController],
  providers: [],
  exports: [],
})
export class MediaModule {}
