import { Module } from '@nestjs/common';
import { MetadataModule } from '../metadata/metadata.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { IndexersController } from './indexers.controller.js';
import { IndexersService } from './indexers.service.js';

@Module({
  imports: [SettingsModule, MetadataModule],
  controllers: [IndexersController],
  providers: [IndexersService],
  exports: [IndexersService],
})
export class IndexersModule {}
