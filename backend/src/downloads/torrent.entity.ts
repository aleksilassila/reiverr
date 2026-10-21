import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';
import type { TorrentFileInfo } from './torrent-engine.js';

/**
 * A torrent the server knows, by its info hash. The library creates it from
 * a release a user picked, and asks for items of it; downloads does the
 * rest.
 */
@Entity()
export class Torrent {
  @ApiProperty({ type: 'string' })
  @PrimaryKey()
  infoHash: string;

  @ApiProperty({ type: 'string' })
  @Property()
  title: string;

  @ApiProperty({ type: 'string' })
  @Property()
  indexer: string;

  @ApiProperty({ type: 'number', description: 'Bytes' })
  @Property()
  size: number;

  @Property({ type: 'text', nullable: true })
  magnetUrl?: string;

  @Property({ type: 'blob', nullable: true, lazy: true })
  torrentFile?: Buffer;

  /** Known at once for a .torrent file, after the first peers for a magnet link */
  @Property({ type: 'json', nullable: true })
  files?: TorrentFileInfo[];

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

  /** Why the torrent stopped, until its release is picked or needed again */
  @Property({ type: 'text', nullable: true })
  error?: string;

  @Property()
  createdAt: Date = new Date();
}
