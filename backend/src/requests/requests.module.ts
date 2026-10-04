import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { MetadataModule } from '../metadata/metadata.module.js';
import { AdminRequestsController } from './admin-requests.controller.js';
import { RequestsController } from './requests.controller.js';
import { RequestRule } from './request-rule.entity.js';
import { MediaRequest } from './request.entity.js';
import { RequestsService } from './requests.service.js';

@Module({
  imports: [
    MikroOrmModule.forFeature([MediaRequest, RequestRule]),
    MetadataModule,
  ],
  controllers: [RequestsController, AdminRequestsController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
