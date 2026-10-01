import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller.js';
import { PluginsModule } from '../plugins/plugins.module.js';
import { MetadataModule } from '../metadata/metadata.module.js';
import { PlayStatesModule } from '../user-data/play-state/play-states.module.js';

@Module({
  imports: [PluginsModule, MetadataModule, PlayStatesModule],
  controllers: [RequestsController],
  providers: [],
  exports: [],
})
export class RequestsModule {}
