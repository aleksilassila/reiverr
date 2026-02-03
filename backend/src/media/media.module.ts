import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { PluginsModule } from 'src/plugins/plugins.module';

@Module({
  imports: [PluginsModule],
  controllers: [MediaController],
  providers: [],
  exports: [],
})
export class MediaModule {}
