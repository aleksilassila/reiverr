import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { DownloadsModule } from '../downloads/downloads.module.js';
import { JobsModule } from '../jobs/jobs.module.js';
import { MetadataModule } from '../metadata/metadata.module.js';
import { RequestsModule } from '../requests/requests.module.js';
import { ServerLogModule } from '../server-log/server-log.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { PlayStatesModule } from '../user-data/play-state/play-states.module.js';
import { UsersModule } from '../users/users.module.js';
import { CatalogService } from './catalog.service.js';
import { DeletionService } from './deletion.service.js';
import { FulfilmentService } from './fulfilment.service.js';
import { ImportService } from './import.service.js';
import { LibraryController } from './library.controller.js';
import { LibraryService } from './library.service.js';
import { MediaFile } from './media-file.entity.js';
import { PlaybackService } from './playback.service.js';
import { RequestBinding } from './request-binding.entity.js';
import { ScanService } from './scan.service.js';
import { StatusService } from './status.service.js';
import { StorageService } from './storage.service.js';

@Module({
  imports: [
    MikroOrmModule.forFeature([MediaFile, RequestBinding]),
    SettingsModule,
    MetadataModule,
    ServerLogModule,
    RequestsModule,
    UsersModule,
    PlayStatesModule,
    DownloadsModule,
    JobsModule,
  ],
  controllers: [LibraryController],
  providers: [
    LibraryService,
    ScanService,
    PlaybackService,
    ImportService,
    DeletionService,
    StorageService,
    FulfilmentService,
    StatusService,
    CatalogService,
  ],
  exports: [LibraryService, ScanService, DeletionService, FulfilmentService],
})
export class LibraryModule {}
