import { ApiProperty } from '@nestjs/swagger';
import { MediaType } from '../common/common.dto.js';
import { TmdbItemDto } from '../metadata/tmdb/tmdb.dto.js';
import { PlayStateDto } from '../user-data/play-state/play-state.dto.js';

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
  /** Watched, with a release to come */
  Upcoming = 'upcoming',
  Unwatched = 'unwatched',
  /** Watched, with nothing to come */
  Watched = 'watched',
  /** Unwatched and played in the last month */
  ContinueWatching = 'continue-watching',
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
}
