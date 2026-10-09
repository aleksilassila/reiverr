import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module.js';
import { MetadataModule } from '../metadata/metadata.module.js';
import { RequestsModule } from '../requests/requests.module.js';
import { ServerLogModule } from '../server-log/server-log.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { LocalMediaController } from './local-media.controller.js';
import { LocalMediaService } from './local-media.service.js';
import { MediaFile } from './media-file.entity.js';

@Module({
  imports: [
    MikroOrmModule.forFeature([MediaFile]),
    SettingsModule,
    MetadataModule,
    ServerLogModule,
    RequestsModule,
    JobsModule,
  ],
  controllers: [LocalMediaController],
  providers: [LocalMediaService],
  exports: [LocalMediaService],
})
export class LocalMediaModule {}
