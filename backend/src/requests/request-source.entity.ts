import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';
import { MediaType } from '../common/common.dto.js';
import { User } from '../users/user.entity.js';

export type RequestSourceKind = 'torrent' | 'file';

/**
 * Where the requests of a user for a season (episode 0), an episode or a
 * movie (season and episode 0) get their files: the release the user
 * picked, kept with its magnet link or the fetched .torrent file so that
 * it can be downloaded long after the search result has expired, or a
 * file in the library. An episode's own source wins over its season's. A
 * torrent source gives its requests a source once it has its release.
 */
@Entity({ tableName: 'request_source' })
@Unique({ properties: ['userId', 'mediaType', 'tmdbId', 'season', 'episode'] })
export class RequestSource {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ManyToOne(() => User, {
    mapToPk: true,
    fieldName: 'user_id',
    deleteRule: 'cascade',
  })
  userId: string;

  @Property({ type: 'string' })
  mediaType: MediaType;

  @Property()
  tmdbId: string;

  @Property()
  season: number;

  @Property()
  episode: number;

  @Property({ type: 'string' })
  kind: RequestSourceKind;

  /** A file source: the file in the library */
  @Property({ nullable: true })
  mediaFileId?: string;

  /** A torrent source: the release as it was picked */
  @Property({ nullable: true })
  infoHash?: string;

  @Property({ nullable: true })
  title?: string;

  @Property({ nullable: true })
  indexer?: string;

  /** Bytes */
  @Property({ type: 'integer', nullable: true })
  size?: number;

  @Property({ type: 'text', nullable: true })
  magnetUrl?: string;

  @Property({ type: 'blob', nullable: true, lazy: true })
  torrentFile?: Buffer;

  @Property()
  createdAt: Date = new Date();
}
