import { ApiProperty } from '@nestjs/swagger';
import { MediaType } from '../common/common.dto.js';
import { TmdbItemDto } from '../metadata/tmdb/tmdb.dto.js';
import { PlayStateDto } from '../user-data/user-data.dto.js';

export enum LibraryOrder {
  /** When the newest file of the title was indexed */
  DateAdded = 'date-added',
  Name = 'name',
  FirstReleaseDate = 'first-release-date',
  LastReleaseDate = 'last-release-date',
}

export enum LibraryStatus {
  /** Titles the user has requests for */
  Requested = 'requested',
  /** Titles with files that the user has no request for */
  Unrequested = 'unrequested',
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

/** A title of a catalogue of the user, with what the library and their requests have of it */
export class CatalogTitleDto {
  @ApiProperty({ enum: MediaType })
  mediaType: MediaType;

  @ApiProperty()
  tmdbId: string;

  @ApiProperty({ type: TmdbItemDto })
  tmdbItem: TmdbItemDto;

  @ApiProperty({ description: 'Whether the user has a request for the title' })
  requested: boolean;

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
    type: PlayStateDto,
    required: false,
    description: 'The play state of the title that the user played last',
  })
  lastPlayState?: PlayStateDto;

  @ApiProperty({
    type: NextEpisodeDto,
    required: false,
    description:
      'The first unwatched episode after the one the user watched last of a series; absent for a movie, and when nothing is left to watch or the user has nothing of the series yet',
  })
  nextEpisode?: NextEpisodeDto;
}
