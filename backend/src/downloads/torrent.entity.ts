import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import type { TorrentFile } from './torrent-engine.js';

/** A torrent the server knows, shared by everyone who selects it */
@Entity()
export class Torrent {
  @ApiProperty({ type: 'string' })
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ApiProperty({ type: 'string' })
  @Property({ unique: true })
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
  files?: TorrentFile[];

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

  @Property()
  createdAt: Date = new Date();
}
