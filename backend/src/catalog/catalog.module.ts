import { Module } from '@nestjs/common';
import { LibraryModule } from '../library/library.module.js';
import { MetadataModule } from '../metadata/metadata.module.js';
import { UserDataModule } from '../user-data/user-data.module.js';
import { CatalogController } from './catalog.controller.js';
import { CatalogService } from './catalog.service.js';

@Module({
  imports: [LibraryModule, MetadataModule, UserDataModule],
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}
