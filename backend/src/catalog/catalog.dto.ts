import { ApiProperty } from '@nestjs/swagger';
import { EpisodeRefDto, MediaType, Title } from '../common/common.dto.js';
import { TorrentStatus } from '../downloads/downloads.dto.js';
import { TmdbItemDto } from '../metadata/tmdb/tmdb.dto.js';
import { RequestRuleDto } from '../requests/requests.dto.js';

/** A title of a catalogue, with its TMDB item */
export class CatalogItemDto implements Title {
  @ApiProperty({ enum: MediaType })
  mediaType: MediaType;

  @ApiProperty()
  tmdbId: string;

  @ApiProperty({ type: TmdbItemDto })
  tmdbItem: TmdbItemDto;
}

/** The sorts of the downloads, as the titles on disk sort on the downloads page */
export enum DownloadsOrder {
  /** What the torrent downloads, largest first */
  Size = 'size',
  Name = 'name',
  /** When the torrent was added, newest first */
  Added = 'added',
}

/** Which downloads are listed; every one without */
export enum DownloadsStatus {
  /** Torrents a request of the user waits for */
  Requested = 'requested',
}

/** A torrent that is downloading, as the engine has it, with the title it downloads */
export class CatalogDownloadDto extends CatalogItemDto {
  @ApiProperty({ type: 'string' })
  infoHash: string;

  @ApiProperty({ description: 'The name of the torrent' })
  name: string;

  @ApiProperty({
    type: [EpisodeRefDto],
    description:
      'The episodes the torrent downloads, in order; a movie is one at season and episode 0',
  })
  episodes: EpisodeRefDto[];

  @ApiProperty({
    enum: TorrentStatus,
    description: 'Starting, or downloading',
  })
  status: TorrentStatus;

  @ApiProperty({
    description:
      'Bytes the torrent downloads for the episodes; the whole torrent until its file list is known',
  })
  size: number;

  @ApiProperty({
    description: 'The share of them that is downloaded, from 0 to 1',
  })
  progress: number;

  @ApiProperty()
  peers: number;

  @ApiProperty({ description: 'Bytes per second' })
  downloadSpeed: number;

  @ApiProperty({
    description: 'Whether a request of the user waits for the torrent',
  })
  requested: boolean;
}

/**
 * The orders of the titles on disk. The size and the date are of what the
 * user's requests hold with the requested status, of every file of the
 * title without
 */
export enum OnDiskOrder {
  /** Largest first */
  Size = 'size',
  Name = 'name',
  /** When the newest file was indexed, newest first */
  Added = 'added',
}

/** Which of the titles on disk are listed; every one without */
export enum OnDiskStatus {
  /** Titles a request of the user has a file of */
  Requested = 'requested',
}

/** A title with files in the library: what they take, and what the requests of the user hold of them */
export class CatalogTitleOnDiskDto extends CatalogItemDto {
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

export enum MyListOrder {
  /** When the title was added to the list */
  DateAdded = 'date-added',
  Name = 'name',
  FirstReleaseDate = 'first-release-date',
  LastReleaseDate = 'last-release-date',
  /** When the user last played the title */
  LastPlayed = 'last-played',
}

export enum MyListStatus {
  /** With an aired episode after the last watched one, or an unwatched movie */
  Unwatched = 'unwatched',
  /** Everything aired watched */
  Watched = 'watched',
  /** Unwatched and played in the last month */
  ContinueWatching = 'continue-watching',
}

export enum MyListAvailability {
  /** The next episode has a file; with nothing aired left to watch, anything of the title has */
  Available = 'available',
  Unavailable = 'unavailable',
}

/** What the user would watch next of a series */
export class NextEpisodeDto {
  @ApiProperty()
  season: number;

  @ApiProperty()
  episode: number;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    required: false,
    description:
      'When the episode aired or airs; absent when it has no date yet',
  })
  airDate?: string;

  @ApiProperty({
    description: 'Whether a file of the library covers the episode',
  })
  onDisk: boolean;
}

/** A title of the user's list, with what the library and their play states have of it */
export class CatalogTitleDto extends CatalogItemDto {
  @ApiProperty({
    description:
      'The episodes of the title that have a file; 1 for a movie with a file',
  })
  available: number;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    required: false,
    description:
      'When the next cleanup deletes every file of the title, because all are managed and no request of anyone holds one; absent otherwise, and while the cleanup is off',
  })
  cleanupAt?: string;

  @ApiProperty({
    required: false,
    description:
      'The progress, from 0 to 1, of what the user played last of the title; absent when they played nothing of it',
  })
  progress?: number;

  @ApiProperty({
    type: NextEpisodeDto,
    required: false,
    description:
      'The first unwatched episode after the one the user watched last of a series; absent for a movie, and when nothing is left to watch or the user has nothing of the series yet',
  })
  nextEpisode?: NextEpisodeDto;
}
