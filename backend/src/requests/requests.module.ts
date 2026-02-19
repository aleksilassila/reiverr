import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { PluginsModule } from 'src/plugins/plugins.module';
import { MetadataModule } from 'src/metadata/metadata.module';
import { PlayStatesModule } from 'src/user-data/play-state/play-states.module';

@Module({
  imports: [PluginsModule, MetadataModule, PlayStatesModule],
  controllers: [RequestsController],
  providers: [],
  exports: [],
})
export class RequestsModule {}
