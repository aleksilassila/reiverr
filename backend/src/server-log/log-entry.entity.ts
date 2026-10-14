import {
  Entity,
  Index,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
import { ApiProperty } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';

export enum LogType {
  /** A file was deleted from the library */
  FileDeleted = 'file.deleted',
  /** The downloaded data of a torrent was deleted from the downloads folder */
  DownloadDeleted = 'download.deleted',
  /** The nightly scan could not scan a library folder */
  ScanFailed = 'scan.failed',
}

/** Something the server did on its own, kept so that it can be looked up later */
@Entity()
@Index({ properties: ['createdAt'] })
export class LogEntry {
  @ApiProperty({ type: 'string' })
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ApiProperty({ enum: LogType })
  @Property({ type: 'string' })
  type: LogType;

  @ApiProperty({ type: 'string' })
  @Property({ type: 'text' })
  message: string;

  /** What the entry is about, by type */
  @ApiProperty({ required: false, type: Object })
  @Property({ type: 'json', nullable: true })
  data?: Record<string, unknown>;

  @ApiProperty({ type: 'string', format: 'date-time' })
  @Property()
  createdAt: Date = new Date();
}
