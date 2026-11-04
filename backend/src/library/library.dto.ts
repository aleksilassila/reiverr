import { ApiProperty, getSchemaPath, OmitType } from '@nestjs/swagger';

/** A cleanup runs at 4 in the morning, in the time zone of the server */
export enum CleanupSchedule {
  Off = 'off',
  Daily = 'daily',
  /** On Mondays */
  Weekly = 'weekly',
  /** On the first of the month */
  Monthly = 'monthly',
}

/** A library folder, keyed by its path in the settings */
export class LibraryFolderDto {
  @ApiProperty({
    description:
      'Whether new titles are imported into the folder. Exactly one folder of each type is primary, when there are any',
  })
  primary: boolean;
}

export class LibrarySettingsDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(LibraryFolderDto) },
    description: 'The movie folders by their paths',
  })
  movieFolders: Record<string, LibraryFolderDto>;

  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(LibraryFolderDto) },
    description: 'The series folders by their paths',
  })
  seriesFolders: Record<string, LibraryFolderDto>;

  @ApiProperty({
    enum: CleanupSchedule,
    description:
      'When the managed files that no request holds are deleted: at 4 in the morning every day, on Mondays or on the first of the month',
  })
  cleanup: CleanupSchedule;

  @ApiProperty({
    type: 'number',
    nullable: true,
    description:
      'The share of a disk, in percent, at which nothing more is downloaded for anyone, measured over the download directory and the library folders. Null for no limit',
  })
  maxDiskUsagePercent: number | null;
}

export class SubtitleFileDto {
  @ApiProperty()
  fileName: string;

  @ApiProperty({
    required: false,
    description: 'Language code from the file name',
  })
  lang?: string;

  @ApiProperty({
    description: 'The tags of the file name, such as "en forced"',
  })
  label: string;
}

export class LibraryFileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  size: number;

  @ApiProperty({
    type: [SubtitleFileDto],
    description: 'Subtitle files next to the video',
  })
  subtitles: SubtitleFileDto[];

  @ApiProperty({
    description:
      'Whether the cleanup may delete the file when no request holds it',
  })
  managed: boolean;

  @ApiProperty({
    required: false,
    description: 'The torrent the file was imported from',
  })
  infoHash?: string;
}

export class LibraryEpisodeFileDto extends LibraryFileDto {
  @ApiProperty()
  season: number;

  @ApiProperty({ type: [Number] })
  episodes: number[];
}

export class LibraryEntryDto {
  @ApiProperty({
    description: 'Where it is in the library folder, with / between the names',
  })
  path: string;

  @ApiProperty()
  isDirectory: boolean;

  @ApiProperty({ description: 'Bytes, 0 for a directory' })
  size: number;

  @ApiProperty({
    required: false,
    description: 'The id of the file, when it is a video that is indexed',
  })
  mediaFileId?: string;

  @ApiProperty({
    required: false,
    description:
      'For an indexed file, whether it was imported from a torrent, which leaves it to the cleanup',
  })
  managed?: boolean;

  @ApiProperty({
    required: false,
    description:
      'Why the entry could not be read. What is in a directory that could not be read is not listed',
  })
  error?: string;
}

export class FailedLibraryEntryDto {
  @ApiProperty()
  path: string;

  @ApiProperty()
  error: string;
}

export class ScanLibraryResultDto {
  @ApiProperty({ description: 'Files that are new to the index' })
  added: number;

  @ApiProperty({ description: 'Indexed files that changed on disk' })
  updated: number;

  @ApiProperty({ description: 'Indexed files that are no longer on disk' })
  forgotten: number;

  @ApiProperty({
    type: [String],
    description:
      'Title folders with videos that could not be matched to a title, whose files are not indexed',
  })
  unresolved: string[];

  @ApiProperty({
    type: [FailedLibraryEntryDto],
    description:
      'Directories that could not be read and why. Indexed files in them are kept',
  })
  failed: FailedLibraryEntryDto[];
}

export class LibraryScanPreviewDto {
  @ApiProperty({
    description:
      'Whether the folder reads as mounted: it can be read, and it has something in it when files are indexed in it',
  })
  available: boolean;

  @ApiProperty({ required: false, description: 'Why it is not available' })
  reason?: string;

  @ApiProperty({
    description:
      'Indexed files that a scan would forget: all of them when the folder is not available',
  })
  missing: number;

  @ApiProperty({
    description:
      'Requests that those files fulfil, which download them again when the files are forgotten',
  })
  requests: number;
}

export class CleanupPreviewDto {
  @ApiProperty({
    description:
      'Managed files that no request holds, which the cleanup deletes. One that is not as it was imported is kept as external instead',
  })
  files: number;

  @ApiProperty({ description: 'Bytes, of those files' })
  size: number;
}

export class DeleteLibraryEntriesResultDto {
  @ApiProperty({ description: 'How many of the entries were deleted' })
  deleted: number;

  @ApiProperty({
    type: [FailedLibraryEntryDto],
    description:
      'The entries that could not be deleted, or not completely, and why',
  })
  failed: FailedLibraryEntryDto[];
}

/** A file of a title in the index, as of its last scan, whether or not it is on disk now */
export class MediaFileDto extends OmitType(LibraryEpisodeFileDto, [
  'subtitles',
]) {
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    required: false,
    description:
      'When the next cleanup deletes the file: a managed file that no request of anyone holds',
  })
  cleanupAt?: Date;
}

/** How the library fulfils a request of the user */
export enum FulfilmentStatus {
  /** The request is active and nothing is bound to it yet: the library is about to look at it */
  Pending = 'pending',
  /** The request waits for its torrent item; how that goes, the torrents of the title say */
  Downloading = 'downloading',
  /** The request has its file in the library */
  Fulfilled = 'fulfilled',
  /** The request cannot get its file: the import of its torrent item failed, or the file it prefers is not in the library or not of it */
  Failed = 'failed',
  /** What the request is to get does not fit the quota of the user; it is looked at again when room is made */
  OverQuota = 'over-quota',
  /** A disk is at the limit of the library settings, so nothing more is downloaded for anyone */
  DiskFull = 'disk-full',
}

/**
 * How the library fulfils a request of the user, by what the library
 * wrote of it. Whether the request is approved, ahead or has a source, the
 * requests of the title say; what the engine is doing, the torrents of the
 * title.
 */
export class FulfilmentStatusDto {
  @ApiProperty()
  requestId: string;

  @ApiProperty({ enum: FulfilmentStatus })
  status: FulfilmentStatus;

  @ApiProperty({
    required: false,
    description: 'The file the request has, one of the files of the title',
  })
  mediaFileId?: string;

  @ApiProperty({
    required: false,
    description:
      'The torrent of the torrent item the request waits for, or whose import failed',
  })
  infoHash?: string;

  @ApiProperty({ required: false })
  error?: string;
}

export class MovieStatusDto {
  @ApiProperty({
    type: FulfilmentStatusDto,
    required: false,
    description:
      'Of the request of the user, when it has a file or the library acts on it',
  })
  fulfilment?: FulfilmentStatusDto;

  @ApiProperty({
    type: [MediaFileDto],
    description: 'The files of the movie in the index, by path',
  })
  files: MediaFileDto[];
}

export class SeriesStatusDto {
  @ApiProperty({
    type: [FulfilmentStatusDto],
    description:
      'Of the requests of the user that have a file or that the library acts on',
  })
  fulfilments: FulfilmentStatusDto[];

  @ApiProperty({
    type: [MediaFileDto],
    description: 'The files of the series in the index, by path',
  })
  files: MediaFileDto[];
}

export class StorageUsageDto {
  @ApiProperty({
    type: 'number',
    nullable: true,
    description: 'Bytes; null for no quota',
  })
  quotaBytes: number | null;

  @ApiProperty({
    description: 'Bytes of the files that the requests of the user hold',
  })
  heldBytes: number;

  @ApiProperty({
    description:
      'Bytes that the downloads the requests of the user wait for are expected to take',
  })
  pendingBytes: number;
}

export class DiskUsageDto {
  @ApiProperty({ description: 'The download directory or a library folder' })
  path: string;

  @ApiProperty()
  totalBytes: number;

  @ApiProperty({ description: 'Bytes available to the server' })
  freeBytes: number;

  @ApiProperty({ description: 'From 0 to 100' })
  usedPercent: number;
}
