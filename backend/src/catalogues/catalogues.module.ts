import { Module } from '@nestjs/common';
import { CataloguesController } from './catalogues.controller';
import { PluginsModule } from 'src/plugins/plugins.module';
import { MetadataModule } from 'src/metadata/metadata.module';

@Module({
  imports: [PluginsModule, MetadataModule],
  controllers: [CataloguesController],
  providers: [],
  exports: [],
})
export class CataloguesModule {}
