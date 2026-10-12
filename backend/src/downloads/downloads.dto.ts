import { ApiProperty } from '@nestjs/swagger';
import { EpisodeRefDto } from '../common/common.dto.js';

/** A cleanup runs at 4 in the morning, in the time zone of the server */
export enum CleanupSchedule {
  Off = 'off',
  Daily = 'daily',
  /** On Mondays */
  Weekly = 'weekly',
  /** On the first of the month */
  Monthly = 'monthly',
}

export class DownloadSettingsDto {
  @ApiProperty({
    description:
      'Torrents are seeded until they have uploaded this many times what they downloaded. 0 disables seeding.',
  })
  seedRatio: number;

  @ApiProperty({
    enum: CleanupSchedule,
    description:
      'When the imported files that no request keeps are deleted: at 4 in the morning every day, on Mondays or on the first of the month',
  })
  cleanup: CleanupSchedule;
}

export enum TorrentStatus {
  /** Nothing of the torrent is wanted, its data is not kept */
  Stopped = 'stopped',
  /** Connecting and fetching the file list */
  Starting = 'starting',
  Downloading = 'downloading',
  Seeding = 'seeding',
  Failed = 'failed',
}

export class TorrentDto {
  @ApiProperty({
    type: 'string',
    required: false,
    description: 'Missing while no request downloads from the torrent',
  })
  id?: string;

  @ApiProperty({ type: 'string' })
  infoHash: string;

  @ApiProperty({ type: 'string' })
  title: string;

  @ApiProperty({ type: 'string' })
  indexer: string;

  @ApiProperty({ type: 'number', description: 'Bytes' })
  size: number;

  @ApiProperty({
    type: 'number',
    description:
      'Bytes downloaded for the data currently in the downloads folder',
  })
  downloadedBytes: number;

  @ApiProperty({ type: 'number', description: 'Bytes uploaded for that data' })
  uploadedBytes: number;

  @ApiProperty({ enum: TorrentStatus })
  status: TorrentStatus;

  @ApiProperty({ required: false })
  error?: string;

  @ApiProperty({
    required: false,
    type: 'string',
    format: 'date-time',
    description: 'When a torrent that failed is started again',
  })
  retryAt?: Date;

  @ApiProperty()
  peers: number;

  @ApiProperty({ description: 'Bytes per second' })
  downloadSpeed: number;

  @ApiProperty({ description: 'Bytes per second' })
  uploadSpeed: number;
}

/** A file in the library a user prefers for an episode */
export class PreferredFileDto {
  @ApiProperty({
    description: 'The id of the file, which the API serves it by',
  })
  id: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty({ description: 'Bytes' })
  size: number;

  @ApiProperty({
    description:
      'Whether the file is still in the library. The requests of a file that is not fail until another source is picked',
  })
  inLibrary: boolean;

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
  @ApiProperty({
    type: 'string',
    required: false,
    description: 'The search result the user picked',
  })
  releaseId?: string;

  @ApiProperty({ type: TorrentDto, required: false })
  torrent?: TorrentDto;

  @ApiProperty({ type: PreferredFileDto, required: false })
  file?: PreferredFileDto;
}

export enum EpisodeDownloadStatus {
  WaitingForApproval = 'waiting-for-approval',
  /** The rule of the user holds the request back until they have watched up to it */
  InactiveAhead = 'inactive-ahead',
  NoPreference = 'no-preference',
  /** The torrent of the request is being resolved, or its files are not known yet */
  Resolving = 'resolving',
  NoFileInTorrent = 'no-file-in-torrent',
  Downloading = 'downloading',
  Failed = 'failed',
  /** The file of the torrent of the request is in the library */
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
      'Info hashes of the torrents that a request of anyone downloads from or that files of it came from',
  })
  onServer: string[];
}
