import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module.js';
import { JobsModule } from '../jobs/jobs.module.js';
import { ServerLogModule } from '../server-log/server-log.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { DownloadsController } from './downloads.controller.js';
import { DownloadsService } from './downloads.service.js';
import { TorrentItem } from './torrent-item.entity.js';
import { TorrentRuntime } from './torrent-runtime.js';
import { TORRENT_ENGINE } from './torrent-engine.js';
import { Torrent } from './torrent.entity.js';
import { WebTorrentEngine } from './webtorrent.engine.js';

@Module({
  imports: [
    MikroOrmModule.forFeature([Torrent, TorrentItem]),
    SettingsModule,
    ServerLogModule,
    JobsModule,
    EventsModule,
  ],
  controllers: [DownloadsController],
  providers: [
    DownloadsService,
    TorrentRuntime,
    { provide: TORRENT_ENGINE, useClass: WebTorrentEngine },
  ],
  exports: [DownloadsService],
})
export class DownloadsModule {}
