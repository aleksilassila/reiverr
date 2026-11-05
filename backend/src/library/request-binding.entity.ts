import {
  Entity,
  Index,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';

/** Why a request has no file */
export enum FulfilmentError {
  /** The import of its torrent item failed; the torrent tries again */
  ImportFailed = 'import-failed',
  /** The file its user selected is not in the library */
  FileNotInLibrary = 'file-not-in-library',
  /** The file its user selected is not of its movie or episode */
  FileNotOfMedia = 'file-not-of-media',
  /** What it is to get does not fit the quota of its user; it is looked at again when room is made */
  OverQuota = 'over-quota',
  /** A disk is at the limit of the library settings, so nothing more is downloaded for anyone; it is looked at again when room is made */
  DiskFull = 'disk-full',
}

/**
 * How the library fulfils a request: the torrent item it waits for, or
 * the file in the library it has, and what keeps it from its file. A request
 * holds its file through its binding; a managed file no binding refers to
 * is the cleanup's. The request lives in the requests module, the torrent
 * item in downloads: nothing cascades, the library keeps the rows in line.
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

  /** Why the request has no file */
  @Property({ type: 'text', nullable: true })
  error?: FulfilmentError;

  /** The same for people to read, with what is known of it */
  @Property({ type: 'text', nullable: true })
  errorMessage?: string;

  @Property()
  updatedAt: Date = new Date();
}
