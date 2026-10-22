import {
  Entity,
  Index,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';
import { MediaType } from '../common/common.dto.js';

/** A video file in one of the library folders that the server knows about */
@Entity()
@Index({ properties: ['mediaType', 'tmdbId'] })
export class MediaFile {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'text', unique: true })
  path: string;

  @Property({ type: 'string' })
  mediaType: MediaType;

  @Property()
  tmdbId: string;

  @Property({ default: 0 })
  season: number = 0;

  @Property({ default: 0 })
  episode: number = 0;

  /** Differs from the episode for a file with several episodes */
  @Property({ default: 0 })
  lastEpisode: number = 0;

  @Property()
  size: number;

  @Property()
  modifiedAt: Date;

  /** The torrent the file was imported from, which makes it a version */
  @Property({ nullable: true })
  infoHash?: string;

  /**
   * A managed file is the server's to delete when no request holds it:
   * imported files are, and files an admin marked so. External files, found
   * on disk, are never cleaned up.
   */
  @Property({ default: false })
  managed: boolean = false;

  @Property()
  createdAt: Date = new Date();
}
