import { ApiProperty, OmitType } from '@nestjs/swagger';
import { EpisodeRefDto } from '../common/common.dto.js';
import { TorrentSelection } from './torrent-selection.entity.js';

export class DownloadSettingsDto {
  @ApiProperty({
    description:
      'Torrents are seeded until they have uploaded this many times what they downloaded. 0 disables seeding.',
  })
  seedRatio: number;
}

export class TorrentSelectionDto extends OmitType(TorrentSelection, [
  'magnetUrl',
  'downloadUrl',
]) {}

export class SelectReleaseDto {
  @ApiProperty({ description: 'Id of a release from an indexer search' })
  releaseId: string;
}

export enum TorrentStatus {
  /** Connecting and fetching the file list */
  Starting = 'starting',
  Downloading = 'downloading',
  Seeding = 'seeding',
  Failed = 'failed',
}

export class TorrentStateDto {
  @ApiProperty()
  selectionId: string;

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

export class EpisodeDownloadDto extends EpisodeRefDto {
  @ApiProperty()
  selectionId: string;

  @ApiProperty({ description: 'From 0 to 1' })
  progress: number;

  @ApiProperty({ required: false })
  error?: string;
}

export class SeriesDownloadsDto {
  @ApiProperty({ type: [TorrentSelectionDto] })
  selections: TorrentSelectionDto[];

  @ApiProperty({
    type: [TorrentStateDto],
    description: 'Selections whose torrent is running',
  })
  torrents: TorrentStateDto[];

  @ApiProperty({
    type: [EpisodeDownloadDto],
    description: 'Episodes that are being downloaded',
  })
  episodes: EpisodeDownloadDto[];

  @ApiProperty({ type: [EpisodeRefDto] })
  onDisk: EpisodeRefDto[];
}
