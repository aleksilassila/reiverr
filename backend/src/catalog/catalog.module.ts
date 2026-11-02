import { Module } from '@nestjs/common';
import { DownloadsModule } from '../downloads/downloads.module.js';
import { LibraryModule } from '../library/library.module.js';
import { MetadataModule } from '../metadata/metadata.module.js';
import { CatalogController } from './catalog.controller.js';
import { CatalogService } from './catalog.service.js';

@Module({
  imports: [DownloadsModule, LibraryModule, MetadataModule],
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}
