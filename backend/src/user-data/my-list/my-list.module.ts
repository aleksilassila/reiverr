import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { MetadataModule } from '../../metadata/metadata.module.js';
import { MyListController } from './my-list.controller.js';
import { MyListItem } from './my-list-item.entity.js';
import { MyListService } from './my-list.service.js';
import { PlayState } from '../play-state/play-state.entity.js';

@Module({
  imports: [MikroOrmModule.forFeature([MyListItem, PlayState]), MetadataModule],
  providers: [MyListService],
  controllers: [MyListController],
  exports: [MyListService],
})
export class MyListModule {}
