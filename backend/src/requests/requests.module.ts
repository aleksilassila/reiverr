import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { PluginsModule } from 'src/plugins/plugins.module';
import { MetadataModule } from 'src/metadata/metadata.module';

@Module({
  imports: [PluginsModule, MetadataModule],
  controllers: [RequestsController],
  providers: [],
  exports: [],
})
export class RequestsModule {}
