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
import { MovieMetadata } from '../metadata/metadata.entity.js';
import { User } from '../users/user.entity.js';

// Table already carries the name this module gets once the plugin requests are removed
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
