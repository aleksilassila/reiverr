import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import { MediaType } from '../common/common.dto.js';
import { User } from '../users/user.entity.js';
import type { EpisodeSource, SeasonTorrent } from './request-source.js';

/**
 * What a user wants of the requests of a title: which of them are needed,
 * going by what the user has watched, and which torrents or files they get
 * their files from. A limit that is null does not apply. Only series have
 * rules so far.
 */
@Entity()
@Unique({ properties: ['userId', 'mediaType', 'tmdbId'] })
export class RequestRule {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ManyToOne(() => User, {
    mapToPk: true,
    fieldName: 'user_id',
    deleteRule: 'cascade',
  })
  userId: string;

  @Property({ type: 'string', default: MediaType.Series })
  mediaType: MediaType = MediaType.Series;

  @Property()
  tmdbId: string;

  @ApiProperty({
    type: 'number',
    nullable: true,
    description:
      'How many requests after the last episode the user watched are needed',
  })
  @Property({ type: 'integer', nullable: true })
  keepNext: number | null = null;

  @ApiProperty({
    type: 'number',
    nullable: true,
    description:
      'How many of the last watched requests keep their file, while there is more to watch',
  })
  @Property({ type: 'integer', nullable: true })
  keepWatched: number | null = null;

  @ApiProperty({
    type: 'number',
    nullable: true,
    description:
      'For how many hours after it was watched a request keeps its file. With keepWatched, either one keeps it',
  })
  @Property({ type: 'integer', nullable: true })
  keepWatchedHours: number | null = null;

  /** The torrent the user prefers for the episodes of a season */
  @Property({ type: 'json', nullable: true })
  seasonTorrents: SeasonTorrent[] | null = null;

  /** The torrent or the file the user prefers for an episode, over the season's torrent */
  @Property({ type: 'json', nullable: true })
  episodeSources: EpisodeSource[] | null = null;
}
