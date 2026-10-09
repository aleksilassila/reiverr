import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminAccessControl } from '../auth/auth.guard.js';
import { Job, JobStatus } from './job.entity.js';
import { JobsService } from './jobs.service.js';

@ApiTags('server')
@Controller('v2/server/jobs')
@UseGuards(AdminAccessControl)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ApiQuery({ name: 'status', enum: JobStatus, required: false })
  @ApiQuery({ name: 'type', type: 'string', required: false })
  @ApiOkResponse({ type: [Job], description: 'The newest jobs first' })
  getJobs(
    @Query('status') status?: JobStatus,
    @Query('type') type?: string,
  ): Promise<Job[]> {
    return this.jobsService.list({ status, type });
  }

  @Post(':id/retry')
  @HttpCode(200)
  @ApiOkResponse({ description: 'The failed job is queued again' })
  retryJob(@Param('id') id: string): Promise<void> {
    return this.jobsService.retry(id);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'The failed job is deleted' })
  deleteJob(@Param('id') id: string): Promise<void> {
    return this.jobsService.delete(id);
  }
}
