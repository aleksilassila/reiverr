import {
  Entity,
  Index,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';

/**
 * How the library fulfils a request: the item of a torrent it waits for, or
 * the file in the library it has, and what keeps it from its file. A request
 * holds its file through its binding; a managed file no binding refers to
 * is the cleanup's. The request lives in the requests module, the item in
 * downloads: nothing cascades, the library keeps the rows in line.
 */
@Entity({ tableName: 'request_binding' })
@Index({ properties: ['torrentItemId'] })
@Index({ properties: ['mediaFileId'] })
export class RequestBinding {
  @PrimaryKey({ type: 'uuid' })
  requestId: string;

  @Property({ nullable: true })
  torrentItemId?: string;

  /**
   * What the download the request waits for is expected to take: what the
   * request takes of the quota of its user until it has the file
   */
  @Property({ type: 'integer', nullable: true })
  pendingBytes?: number;

  @Property({ nullable: true })
  mediaFileId?: string;

  /** Why the request has no file: its import failed, or the file it wants is not in the library */
  @Property({ type: 'text', nullable: true })
  error?: string;

  @Property()
  updatedAt: Date = new Date();
}
