import { Module } from '@nestjs/common';
import { CataloguesController } from './catalogues.controller.js';
import { PluginsModule } from '../plugins/plugins.module.js';
import { MetadataModule } from '../metadata/metadata.module.js';

@Module({
  imports: [PluginsModule, MetadataModule],
  controllers: [CataloguesController],
  providers: [],
  exports: [],
})
export class CataloguesModule {}
