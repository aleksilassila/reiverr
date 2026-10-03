import { ApiProperty, PickType } from '@nestjs/swagger';
import { EpisodeRefDto } from '../common/common.dto.js';
import { TorrentSelection } from './torrent-selection.entity.js';
import { Torrent } from './torrent.entity.js';

export class DownloadSettingsDto {
  @ApiProperty({
    description:
      'Torrents are seeded until they have uploaded this many times what they downloaded. 0 disables seeding.',
  })
  seedRatio: number;
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
  NoSelection = 'no-selection',
  /** The files of the selected torrent are not known yet */
  Resolving = 'resolving',
  NoFileInTorrent = 'no-file-in-torrent',
  Downloading = 'downloading',
  Failed = 'failed',
  /** The file of the selected torrent is in the library */
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
}

export class SeriesDownloadsDto {
  @ApiProperty({
    type: [TorrentSelectionDto],
    description: 'The torrents the user selected for the series',
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
      'Info hashes of the torrents that someone selected for the series or that files of it came from',
  })
  onServer: string[];
}
