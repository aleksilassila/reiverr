import { ApiProperty, PickType } from '@nestjs/swagger';
import { EpisodeRefDto } from '../common/common.dto.js';
import { TorrentSelection } from './torrent-selection.entity.js';
import { Torrent } from './torrent.entity.js';

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

export class SelectReleaseDto {
  @ApiProperty({ description: 'Id of a release from an indexer search' })
  releaseId: string;
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

export class TorrentDto extends PickType(Torrent, [
  'id',
  'infoHash',
  'title',
  'indexer',
  'size',
  'downloadedBytes',
  'uploadedBytes',
]) {
  @ApiProperty({ enum: TorrentStatus })
  status: TorrentStatus;

  @ApiProperty({ required: false })
  error?: string;

  @ApiProperty()
  peers: number;

  @ApiProperty({ description: 'Bytes per second' })
  downloadSpeed: number;

  @ApiProperty({ description: 'Bytes per second' })
  uploadSpeed: number;
}

export class TorrentSelectionDto extends PickType(TorrentSelection, [
  'id',
  'season',
  'episode',
  'releaseId',
]) {
  @ApiProperty({ type: TorrentDto })
  torrent: TorrentDto;
}

export enum EpisodeDownloadStatus {
  WaitingForApproval = 'waiting-for-approval',
  /** The rule of the user holds the request back until they have watched up to it */
  InactiveAhead = 'inactive-ahead',
  /** The rule of the user does not keep the request of the watched episode, or has no file of it to keep */
  InactiveWatched = 'inactive-watched',
  NoSelection = 'no-selection',
  /** The files of the torrent of the request are not known yet */
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

export class SeriesDownloadsDto {
  @ApiProperty({
    type: [TorrentSelectionDto],
    description:
      'The torrents the user selected for the series, which their requests are bound to',
  })
  selections: TorrentSelectionDto[];

  @ApiProperty({
    type: [EpisodeStatusDto],
    description: 'The episodes that the user requested or that are on disk',
  })
  episodes: EpisodeStatusDto[];

  @ApiProperty({
    type: [String],
    description:
      'Info hashes of the torrents that someone selected for the series, that a request for it is bound to or that files of it came from',
  })
  onServer: string[];
}
