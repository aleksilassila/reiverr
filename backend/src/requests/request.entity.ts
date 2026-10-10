import type { Rel } from '@mikro-orm/core';
import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import { MediaTypeFull } from '../common/common.dto.js';
import { Torrent } from '../downloads/torrent.entity.js';
import { MediaFile } from '../local-media/media-file.entity.js';
import { MovieMetadata } from '../metadata/metadata.entity.js';
import { User } from '../users/user.entity.js';
import { ACTIVITIES, type Activity } from './request-activity.js';

@Entity({ tableName: 'request' })
@Unique({
  properties: ['userId', 'mediaType', 'tmdbId', 'season', 'episode'],
})
export class MediaRequest {
  @ApiProperty({ type: 'string' })
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ApiProperty({ type: 'string' })
  @ManyToOne(() => User, {
    mapToPk: true,
    fieldName: 'user_id',
    deleteRule: 'cascade',
  })
  userId: string;

  @ApiProperty({ type: 'string' })
  @Property()
  tmdbId: string;

  @ApiProperty({ enum: MediaTypeFull })
  @Property({ type: 'string' })
  mediaType: MediaTypeFull;

  @ApiProperty({ type: 'number', description: '0 for movies' })
  @Property({ default: 0 })
  season: number = 0;

  @ApiProperty({ type: 'number', description: '0 for movies' })
  @Property({ default: 0 })
  episode: number = 0;

  @ApiProperty({ type: 'boolean' })
  @Property({ default: false })
  approved: boolean = false;

  /**
   * Whether the request wants and holds its file, going by its approval and
   * the rule of its user for the title. Stored by the requests service
   * whenever one of those changes.
   */
  @ApiProperty({ enum: ACTIVITIES })
  @Property({ type: 'string', default: 'waiting' })
  activity: Activity = 'waiting';

  /** The torrent the request downloads from, once it is bound to one */
  @ManyToOne(() => Torrent, {
    mapToPk: true,
    fieldName: 'torrent_id',
    nullable: true,
    deleteRule: 'set null',
  })
  torrentId?: string;

  /**
   * The file that fulfils the request, which the request holds. Without one
   * the request is not fulfilled.
   */
  @ManyToOne(() => MediaFile, {
    mapToPk: true,
    fieldName: 'media_file_id',
    nullable: true,
    deleteRule: 'set null',
  })
  mediaFileId?: string;

  /** Why the request has no file: its torrent could not be resolved, or its file could not be imported */
  @ApiProperty({ required: false, type: 'string' })
  @Property({ type: 'text', nullable: true })
  error?: string;

  /** How many times in a row its torrent could not be resolved */
  @Property({ default: 0 })
  attempts: number = 0;

  /** When resolving its torrent is tried again */
  @ApiProperty({ required: false, type: 'string', format: 'date-time' })
  @Property({ nullable: true })
  retryAt?: Date;

  @ApiProperty({ required: false, type: () => MovieMetadata })
  @ManyToOne(() => MovieMetadata, {
    targetKey: 'tmdbId',
    fieldName: 'tmdb_id',
    persist: false,
    nullable: true,
    createForeignKeyConstraint: false,
  })
  movieMetadata?: Rel<MovieMetadata>;

  @ApiProperty({ type: 'string' })
  @Property()
  createdAt: Date = new Date();

  @ApiProperty({ type: 'string' })
  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
