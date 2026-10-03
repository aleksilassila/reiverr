import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { MetadataModule } from '../../metadata/metadata.module.js';
import { LibraryController } from './library.controller.js';
import { LibraryItem } from './library.entity.js';
import { LibraryService } from './library.service.js';
import { PlayState } from '../play-state/play-state.entity.js';

@Module({
  imports: [
    MikroOrmModule.forFeature([LibraryItem, PlayState]),
    MetadataModule,
  ],
  providers: [LibraryService],
  controllers: [LibraryController],
  exports: [LibraryService],
})
export class LibraryModule {}
