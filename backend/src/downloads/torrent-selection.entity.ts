import {
  Entity,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import { MediaType } from '../common/common.dto.js';

@Entity()
@Unique({ properties: ['mediaType', 'tmdbId', 'season', 'episode'] })
export class TorrentSelection {
  @ApiProperty({ type: 'string' })
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ApiProperty({ enum: MediaType })
  @Property({ type: 'string' })
  mediaType: MediaType;

  @ApiProperty({ type: 'string' })
  @Property()
  tmdbId: string;

  @ApiProperty({ type: 'number' })
  @Property({ default: 0 })
  season: number = 0;

  @ApiProperty({ type: 'number', description: '0 for a season pack' })
  @Property({ default: 0 })
  episode: number = 0;

  @ApiProperty({ type: 'string' })
  @Property()
  releaseId: string;

  @ApiProperty({ type: 'string' })
  @Property()
  title: string;

  @ApiProperty({ type: 'string' })
  @Property()
  indexer: string;

  @ApiProperty({ type: 'number', description: 'Bytes' })
  @Property()
  size: number;

  @ApiProperty({ required: false, type: 'string' })
  @Property({ nullable: true })
  infoHash?: string;

  @Property({ type: 'text', nullable: true })
  magnetUrl?: string;

  @Property({ type: 'text', nullable: true })
  downloadUrl?: string;

  @ApiProperty({
    type: 'number',
    description:
      'Bytes downloaded for the data currently in the downloads folder',
  })
  @Property({ default: 0 })
  downloadedBytes: number = 0;

  @ApiProperty({ type: 'number', description: 'Bytes uploaded for that data' })
  @Property({ default: 0 })
  uploadedBytes: number = 0;

  @ApiProperty({ type: 'string' })
  @Property()
  createdAt: Date = new Date();
}
