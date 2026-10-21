import { ApiProperty } from '@nestjs/swagger';
import { MediaType } from '../common/common.dto.js';

export class DownloadSettingsDto {
  @ApiProperty({
    description:
      'Torrents are seeded until they have uploaded this many times what they downloaded. 0 disables seeding.',
  })
  seedRatio: number;
}

export enum TorrentStatus {
  /** Nothing of the torrent is wanted, and it has no data */
  Idle = 'idle',
  /** Connecting and fetching the file list */
  Starting = 'starting',
  Downloading = 'downloading',
  Seeding = 'seeding',
  /** Stopped with its data, which an item that waits for its import keeps */
  Stopped = 'stopped',
  Failed = 'failed',
}

export class TorrentDto {
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

  @ApiProperty()
  peers: number;

  @ApiProperty({ description: 'Bytes per second' })
  downloadSpeed: number;

  @ApiProperty({ description: 'Bytes per second' })
  uploadSpeed: number;
}

export enum TorrentItemStatus {
  /** The file list of the torrent is not known yet */
  Resolving = 'resolving',
  /** The torrent has no file for the item */
  NoMatch = 'no-match',
  Downloading = 'downloading',
  /** The file is downloaded and waits for its import */
  Complete = 'complete',
  /** The torrent failed */
  Failed = 'failed',
  /** The library let the item go */
  Released = 'released',
}

/** An item that is wanted from a torrent, and where it stands */
export class TorrentItemDto {
  @ApiProperty({ type: 'string' })
  id: string;

  @ApiProperty({ type: 'string' })
  infoHash: string;

  @ApiProperty({ enum: MediaType })
  mediaType: MediaType;

  @ApiProperty({ type: 'string' })
  tmdbId: string;

  @ApiProperty({ description: '0 for a movie' })
  season: number;

  @ApiProperty({ description: '0 for a movie' })
  episode: number;

  @ApiProperty({ enum: TorrentItemStatus })
  status: TorrentItemStatus;

  @ApiProperty({ required: false, description: 'From 0 to 1' })
  progress?: number;

  @ApiProperty({ required: false })
  error?: string;

  @ApiProperty({
    required: false,
    description: 'The name of the file of the torrent that is the item',
  })
  fileName?: string;
}

export class TorrentWithItemsDto extends TorrentDto {
  @ApiProperty({ type: [TorrentItemDto] })
  items: TorrentItemDto[];
}
