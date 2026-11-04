import { ApiProperty } from '@nestjs/swagger';
import { MediaType } from '../common/common.dto.js';

export class DownloadSettingsDto {
  @ApiProperty({
    description:
      'Torrents are seeded until they have uploaded this many times what they downloaded. 0 disables seeding.',
  })
  seedRatio: number;

  @ApiProperty({
    description:
      'The subtitle files of a torrent that belong to a downloaded video are downloaded with it and put next to it in the library.',
  })
  downloadSubtitles: boolean;
}

export enum TorrentStatus {
  /** Nothing of the torrent is wanted, and it has no data */
  Idle = 'idle',
  /** Connecting and fetching the file list */
  Starting = 'starting',
  Downloading = 'downloading',
  Seeding = 'seeding',
  /** Stopped with its data, which a torrent item that waits for its import keeps */
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

  @ApiProperty({
    type: 'number',
    description:
      'Bytes of the files the torrent downloads for the torrent items wanted of it; the whole torrent until its file list is known',
  })
  wantedBytes: number;

  @ApiProperty({
    type: 'number',
    description:
      'The share of those bytes that is downloaded, from 0 to 1: the files of complete torrent items whole, the rest as the engine has them',
  })
  progress: number;

  @ApiProperty({ enum: TorrentStatus })
  status: TorrentStatus;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'When the server got the torrent',
  })
  addedAt: string;

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
  /** The torrent has no file for the torrent item */
  NoMatch = 'no-match',
  Downloading = 'downloading',
  /** The file is downloaded and waits for its import */
  Complete = 'complete',
  /** The torrent failed */
  Failed = 'failed',
  /** The library let the torrent item go */
  Released = 'released',
}

/** A torrent item that is wanted from a torrent, and its status */
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
    description: 'The name of the file of the torrent that the torrent item is',
  })
  fileName?: string;
}

export class TorrentWithItemsDto extends TorrentDto {
  @ApiProperty({ type: [TorrentItemDto] })
  torrentItems: TorrentItemDto[];
}
