import {
  Entity,
  Index,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';
import { MediaType } from '../common/common.dto.js';
import { Torrent } from './torrent.entity.js';

/**
 * A claim on a torrent for one item: an episode of a series, or a movie
 * with season and episode 0. The library asks for it and releases it;
 * downloads matches it to a file of the torrent once the file list is known
 * and downloads that file. The data of a torrent stays while an item is
 * wanted, which is until the library has imported the file or lets it go.
 */
@Entity({ tableName: 'torrent_item' })
@Unique({
  properties: ['torrentHash', 'mediaType', 'tmdbId', 'season', 'episode'],
})
@Index({ properties: ['releasedAt'] })
export class TorrentItem {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ManyToOne(() => Torrent, {
    mapToPk: true,
    fieldName: 'torrent_hash',
    deleteRule: 'cascade',
  })
  torrentHash: string;

  @Property({ type: 'string' })
  mediaType: MediaType;

  @Property()
  tmdbId: string;

  @Property({ default: 0 })
  season: number = 0;

  @Property({ default: 0 })
  episode: number = 0;

  /**
   * The torrent was picked for this episode alone, so its only video is the
   * episode, whatever the file is called
   */
  @Property({ default: false })
  onlyVideo: boolean = false;

  /** The file of the torrent that is the item, once the file list is known and a file matches */
  @Property({ nullable: true })
  fileIndex?: number;

  /** When the engine reported the file complete */
  @Property({ nullable: true })
  completedAt?: Date;

  /** When the library let the item go: imported, or no longer needed */
  @Property({ nullable: true })
  releasedAt?: Date;

  @Property()
  createdAt: Date = new Date();
}
