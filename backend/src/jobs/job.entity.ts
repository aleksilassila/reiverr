import {
  Entity,
  Index,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';

export enum JobStatus {
  Queued = 'queued',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
}

@Entity({ tableName: 'jobs' })
@Index({ properties: ['status', 'runAt'] })
@Unique({ properties: ['dedupeKey'], where: { status: JobStatus.Queued } })
@Unique({ properties: ['lockKey'], where: { status: JobStatus.Running } })
export class Job {
  @ApiProperty({ type: 'string' })
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ApiProperty({ type: 'string' })
  @Property()
  type: string;

  @ApiProperty({ required: false })
  @Property({ type: 'json', nullable: true })
  payload?: any;

  @ApiProperty({ enum: JobStatus })
  @Property({ type: 'string' })
  status: JobStatus = JobStatus.Queued;

  @ApiProperty({
    required: false,
    type: 'string',
    description: 'Only one job per key can be running at a time',
  })
  @Property({ nullable: true })
  lockKey?: string;

  @ApiProperty({
    required: false,
    type: 'string',
    description: 'Only one job per key can be queued at a time',
  })
  @Property({ nullable: true })
  dedupeKey?: string;

  @ApiProperty({
    type: 'string',
    description: 'Earliest time the job can be claimed',
  })
  @Property()
  runAt: Date = new Date();

  @ApiProperty({ required: false, type: 'string' })
  @Property({ type: 'text', nullable: true })
  error?: string;

  @ApiProperty({ type: 'string' })
  @Property()
  createdAt: Date = new Date();

  @ApiProperty({ required: false, type: 'string' })
  @Property({ nullable: true })
  startedAt?: Date;

  @ApiProperty({ required: false, type: 'string' })
  @Property({ nullable: true })
  finishedAt?: Date;
}
