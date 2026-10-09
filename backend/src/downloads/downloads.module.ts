import { Module } from '@nestjs/common';
import { IndexersModule } from '../indexers/indexers.module.js';
import { JobsModule } from '../jobs/jobs.module.js';
import { LocalMediaModule } from '../local-media/local-media.module.js';
import { RequestsModule } from '../requests/requests.module.js';
import { MetadataModule } from '../metadata/metadata.module.js';
import { ServerLogModule } from '../server-log/server-log.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { DownloadsController } from './downloads.controller.js';
import { DownloadsService } from './downloads.service.js';
import { RetentionService } from './retention.service.js';
import { TorrentRuntime } from './torrent-runtime.js';
import { TORRENT_ENGINE } from './torrent-engine.js';
import { TorrentStreamEngine } from './torrent-stream.engine.js';

@Module({
  imports: [
    SettingsModule,
    MetadataModule,
    RequestsModule,
    IndexersModule,
    LocalMediaModule,
    ServerLogModule,
    JobsModule,
  ],
  controllers: [DownloadsController],
  providers: [
    DownloadsService,
    RetentionService,
    TorrentRuntime,
    { provide: TORRENT_ENGINE, useClass: TorrentStreamEngine },
  ],
  exports: [DownloadsService, RetentionService],
})
export class DownloadsModule {}
