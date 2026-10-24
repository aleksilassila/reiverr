import { Module } from '@nestjs/common';
import { LibraryModule } from '../library/library.module.js';
import { MetadataModule } from '../metadata/metadata.module.js';
import { PlayStatesModule } from '../user-data/play-state/play-states.module.js';
import { CatalogController } from './catalog.controller.js';
import { CatalogService } from './catalog.service.js';

@Module({
  imports: [LibraryModule, MetadataModule, PlayStatesModule],
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}
