import { ApiProperty } from '@nestjs/swagger';
import { EpisodeRefDto } from '../common/common.dto.js';
import { TorrentDto } from '../downloads/downloads.dto.js';

/** A cleanup runs at 4 in the morning, in the time zone of the server */
export enum CleanupSchedule {
  Off = 'off',
  Daily = 'daily',
  /** On Mondays */
  Weekly = 'weekly',
  /** On the first of the month */
  Monthly = 'monthly',
}

export class LibrarySettingsDto {
  @ApiProperty({ type: [String] })
  movieFolders: string[];

  @ApiProperty({ type: [String] })
  seriesFolders: string[];

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

/** A file in the library a user prefers for an episode */
export class PreferredFileDto {
  @ApiProperty({
    description: 'The id of the file, which the API serves it by',
  })
  id: string;

  @ApiProperty({
    description:
      'Whether the file is still in the library. The requests of a file that is not wait until another source is picked',
  })
  inLibrary: boolean;

  @ApiProperty({
    required: false,
    description: 'Unknown when the file is gone',
  })
  fileName?: string;

  @ApiProperty({
    required: false,
    description: 'Bytes, unknown when the file is gone',
  })
  size?: number;

  @ApiProperty({
    required: false,
    description:
      'Whether the cleanup may delete the file when no request holds it',
  })
  managed?: boolean;
}

/**
 * What a user prefers for a season (episode 0) or an episode: a torrent, or
 * for an episode a file in the library
 */
export class PreferenceDto extends EpisodeRefDto {
  @ApiProperty({ type: TorrentDto, required: false })
  torrent?: TorrentDto;

  @ApiProperty({ type: PreferredFileDto, required: false })
  file?: PreferredFileDto;
}

export enum EpisodeDownloadStatus {
  WaitingForApproval = 'waiting-for-approval',
  /** The rule of the user holds the request back until they have watched up to it */
  InactiveAhead = 'inactive-ahead',
  /** The user has picked no source for the episode; a request passes the gate with one */
  NoPreference = 'no-preference',
  /** The library is looking at the request, or the files of its torrent are not known yet */
  Resolving = 'resolving',
  /** The file or the download the request is to get does not fit the quota of the user; it is looked at again when room is made */
  OverQuota = 'over-quota',
  /** A disk is at the limit of the library settings, so nothing more is downloaded for anyone */
  DiskFull = 'disk-full',
  NoFileInTorrent = 'no-file-in-torrent',
  Downloading = 'downloading',
  Failed = 'failed',
  /** The request has its file in the library */
  Available = 'available',
}

export class EpisodeStatusDto extends EpisodeRefDto {
  @ApiProperty({ description: 'Whether the user has requested the episode' })
  requested: boolean;

  @ApiProperty({
    description:
      'Whether a file of the episode is in the library, from any torrent or found on disk',
  })
  onDisk: boolean;

  @ApiProperty({
    enum: EpisodeDownloadStatus,
    required: false,
    description: 'Where the request of the user stands',
  })
  status?: EpisodeDownloadStatus;

  @ApiProperty({ required: false, description: 'From 0 to 1' })
  progress?: number;

  @ApiProperty({ required: false })
  error?: string;

  @ApiProperty({
    type: TorrentDto,
    required: false,
    description:
      'The torrent that the request of the user downloads from or has its file from. A request that has its file keeps it when the user selects another torrent for the season',
  })
  torrent?: TorrentDto;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    required: false,
    description:
      'When the next cleanup deletes the files of the episode, if no request of anyone keeps one of them',
  })
  cleanupAt?: Date;
}

export class SeriesStatusDto {
  @ApiProperty({
    type: [PreferenceDto],
    description:
      'What the user prefers for the seasons and episodes: torrents, and files for episodes',
  })
  preferences: PreferenceDto[];

  @ApiProperty({
    type: [EpisodeStatusDto],
    description: 'The episodes that the user requested or that are on disk',
  })
  episodes: EpisodeStatusDto[];

  @ApiProperty({
    type: [String],
    description:
      'Info hashes of the torrents that have data on the server or that something is wanted of, and of the torrents files came from',
  })
  onServer: string[];
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
