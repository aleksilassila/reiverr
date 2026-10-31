import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module.js';
import { IndexersModule } from '../indexers/indexers.module.js';
import { JobsModule } from '../jobs/jobs.module.js';
import { MetadataModule } from '../metadata/metadata.module.js';
import { AdminRequestsController } from './admin-requests.controller.js';
import { RequestsController } from './requests.controller.js';
import { RequestRule } from './request-rule.entity.js';
import { MediaRequest } from './request.entity.js';
import { RequestsService } from './requests.service.js';
import { SelectedRelease } from './selected-release.entity.js';

@Module({
  imports: [
    MikroOrmModule.forFeature([MediaRequest, RequestRule, SelectedRelease]),
    MetadataModule,
    IndexersModule,
    JobsModule,
    EventsModule,
  ],
  controllers: [RequestsController, AdminRequestsController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
