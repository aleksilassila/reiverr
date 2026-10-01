import { Module } from '@nestjs/common';
import { MetadataModule } from '../metadata/metadata.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { LocalMediaController } from './local-media.controller.js';
import { LocalMediaService } from './local-media.service.js';

@Module({
  imports: [SettingsModule, MetadataModule],
  controllers: [LocalMediaController],
  providers: [LocalMediaService],
  exports: [LocalMediaService],
})
export class LocalMediaModule {}
