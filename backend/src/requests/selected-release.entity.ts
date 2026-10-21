import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/**
 * A release a user picked from a search, kept so that it can be downloaded
 * long after the search result has expired: what the torrent is, with its
 * magnet link or the fetched .torrent file. Shared by everyone who picks the
 * same torrent.
 */
@Entity({ tableName: 'selected_release' })
export class SelectedRelease {
  @PrimaryKey()
  infoHash: string;

  @Property()
  title: string;

  @Property()
  indexer: string;

  /** Bytes */
  @Property()
  size: number;

  @Property({ type: 'text', nullable: true })
  magnetUrl?: string;

  @Property({ type: 'blob', nullable: true, lazy: true })
  torrentFile?: Buffer;

  @Property()
  createdAt: Date = new Date();
}
