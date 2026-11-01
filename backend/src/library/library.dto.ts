import {
  ApiProperty,
  getSchemaPath,
  IntersectionType,
  OmitType,
} from '@nestjs/swagger';
import { EpisodeRefDto, MediaType } from '../common/common.dto.js';
import { TmdbItemDto } from '../metadata/tmdb/tmdb.dto.js';
import { RequestRuleDto } from '../requests/requests.dto.js';

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
]) {}

/** The status of the request of a user for an episode or a movie */
export enum RequestStatus {
  WaitingForApproval = 'waiting-for-approval',
  /** The rule of the user holds the request back until they have watched up to it */
  InactiveAhead = 'inactive-ahead',
  /** The user has picked no source for the episode or the movie; a request passes the gate with one */
  NoPreference = 'no-preference',
  /** The library is looking at the request, or the files of its torrent are not known yet */
  Resolving = 'resolving',
  /** The file or the download the request is to get does not fit the quota of the user; it is looked at again when room is made */
  OverQuota = 'over-quota',
  /** A disk is at the limit of the library settings, so nothing more is downloaded for anyone */
  DiskFull = 'disk-full',
  NoFileInTorrent = 'no-file-in-torrent',
  /** The request waits for the file of its torrent; how far it is, the torrents of the title say */
  Downloading = 'downloading',
  Failed = 'failed',
  /** The request has its file in the library */
  Available = 'available',
}

/**
 * The status of the request of a user for an episode or a movie, and what
 * is on disk of it, by what the modules wrote. The clients are told when
 * that changes; what the engine is doing they have from the torrents of
 * the title.
 */
export class RequestStatusDto {
  @ApiProperty({ description: 'Whether the user has requested it' })
  requested: boolean;

  @ApiProperty({
    description:
      'Whether a file of it is in the library, from any torrent or found on disk',
  })
  onDisk: boolean;

  @ApiProperty({
    enum: RequestStatus,
    required: false,
    description: 'The status of the request of the user',
  })
  status?: RequestStatus;

  @ApiProperty({ required: false })
  error?: string;

  @ApiProperty({
    required: false,
    description:
      'The torrent that the request of the user downloads from or has its file from. A request that has its file keeps it when the user selects another torrent for the season',
  })
  infoHash?: string;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    required: false,
    description:
      'When the next cleanup deletes the files of it, if no request of anyone keeps one of them',
  })
  cleanupAt?: Date;
}

export class EpisodeStatusDto extends IntersectionType(
  EpisodeRefDto,
  RequestStatusDto,
) {}

export class MovieStatusDto extends RequestStatusDto {
  @ApiProperty({
    type: [MediaFileDto],
    description: 'The files of the movie in the index',
  })
  files: MediaFileDto[];
}

export class SeriesStatusDto {
  @ApiProperty({
    type: [EpisodeStatusDto],
    description:
      'The episodes that the user requested or that are on disk, in season and episode order',
  })
  episodes: EpisodeStatusDto[];

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

export class UserStorageDto extends StorageUsageDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;
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

export class StorageDto {
  @ApiProperty({
    type: [DiskUsageDto],
    description: 'The disks the files go to, as far as they can be measured',
  })
  disks: DiskUsageDto[];

  @ApiProperty({
    type: 'number',
    nullable: true,
    description: 'The disk limit of the library settings',
  })
  maxDiskUsagePercent: number | null;

  @ApiProperty({ type: [UserStorageDto] })
  users: UserStorageDto[];
}

/** Which of the titles with files are listed; every one without */
export enum TitleUsageStatus {
  /** Titles a request of the user has a file of */
  Requested = 'requested',
}

/**
 * The sorts of the titles with files. The size and the date are of what the
 * user's requests hold with the requested status, of every file of the
 * title without
 */
export enum TitleUsageSort {
  /** Largest first */
  Size = 'size',
  Name = 'name',
  /** When the newest file was indexed, newest first */
  Added = 'added',
}

/** A title with files in the library, what they take, and what the requests of a user hold of them */
export class TitleUsageDto {
  @ApiProperty({ enum: MediaType })
  mediaType: MediaType;

  @ApiProperty()
  tmdbId: string;

  @ApiProperty({ type: TmdbItemDto })
  tmdbItem: TmdbItemDto;

  @ApiProperty({ description: 'The files of the title in the library' })
  files: number;

  @ApiProperty({
    description:
      'Of the files, the managed ones that no request of anyone holds: what the next cleanup deletes',
  })
  unretained: number;

  @ApiProperty({
    description:
      'Bytes of every file of the title in the library, held by anyone or by nobody',
  })
  diskBytes: number;

  @ApiProperty({ description: 'The requests of the user for the title' })
  requests: number;

  @ApiProperty({ description: 'Of them, those that have their file' })
  fulfilled: number;

  @ApiProperty({
    description:
      'Bytes of the files that the requests of the user hold, each file once',
  })
  heldBytes: number;

  @ApiProperty({
    type: RequestRuleDto,
    required: false,
    description:
      'The limits of the rule of the title; absent without a rule. A movie has keepWatchedHours only',
  })
  rule?: RequestRuleDto;
}
