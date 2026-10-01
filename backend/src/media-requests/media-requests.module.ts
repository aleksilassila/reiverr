import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { MetadataModule } from '../metadata/metadata.module.js';
import { AdminMediaRequestsController } from './admin-media-requests.controller.js';
import { MediaRequestsController } from './media-requests.controller.js';
import { MediaRequest } from './media-request.entity.js';
import { MediaRequestsService } from './media-requests.service.js';

@Module({
  imports: [MikroOrmModule.forFeature([MediaRequest]), MetadataModule],
  controllers: [MediaRequestsController, AdminMediaRequestsController],
  providers: [MediaRequestsService],
  exports: [MediaRequestsService],
})
export class MediaRequestsModule {}
