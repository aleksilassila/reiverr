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
import { MediaType } from '../../common/common.dto.js';
import {
  MovieMetadata,
  SeriesMetadata,
} from '../../metadata/metadata.entity.js';
import { User } from '../../users/user.entity.js';
import { PlayStateDto } from '../play-state/play-state.dto.js';
import { PlayState } from '../play-state/play-state.entity.js';

@Entity()
@Unique({ properties: ['tmdbId', 'userId'] })
export class LibraryItem {
  @ApiProperty({ required: false, type: 'string' })
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ApiProperty({ required: true })
  @Property()
  tmdbId: string;

  @ApiProperty({ required: true, enum: MediaType })
  @Property({ type: 'string' })
  mediaType: MediaType;

  @ApiProperty({ type: 'string', required: false })
  @Property({ nullable: true })
  lastPlayedAt?: Date;

  @ApiProperty({ required: false, type: () => MovieMetadata })
  @ManyToOne(() => MovieMetadata, {
    targetKey: 'tmdbId',
    fieldName: 'tmdb_id',
    persist: false,
    nullable: true,
    createForeignKeyConstraint: false,
  })
  movieMetadata?: Rel<MovieMetadata>;

  @ApiProperty({ required: false, type: () => SeriesMetadata })
  @ManyToOne(() => SeriesMetadata, {
    targetKey: 'tmdbId',
    fieldName: 'tmdb_id',
    persist: false,
    nullable: true,
    createForeignKeyConstraint: false,
  })
  seriesMetadata?: Rel<SeriesMetadata>;

  @ApiProperty({ required: true, type: 'string' })
  @ManyToOne(() => User, {
    mapToPk: true,
    fieldName: 'user_id',
    deleteRule: 'cascade',
  })
  userId: string;

  @ApiProperty({ type: () => [PlayStateDto], required: false })
  playStates?: PlayState[];

  /** @deprecated */
  @ApiProperty({ type: 'string' })
  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @ApiProperty({ type: 'string' })
  @Property()
  createdAt: Date = new Date();
}
