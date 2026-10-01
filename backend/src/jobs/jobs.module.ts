import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service.js';

@Module({
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
