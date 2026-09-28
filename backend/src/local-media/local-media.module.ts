import { Module } from '@nestjs/common';
import { MetadataModule } from 'src/metadata/metadata.module';
import { SettingsModule } from 'src/settings/settings.module';
import { LocalMediaController } from './local-media.controller';
import { LocalMediaService } from './local-media.service';

@Module({
  imports: [SettingsModule, MetadataModule],
  controllers: [LocalMediaController],
  providers: [LocalMediaService],
  exports: [LocalMediaService],
})
export class LocalMediaModule {}
