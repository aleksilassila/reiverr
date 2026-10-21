import { ApiProperty, PickType } from '@nestjs/swagger';
import { TmdbItemDto } from '../../metadata/tmdb/tmdb.dto.js';
import { MyListItem } from './my-list-item.entity.js';
import { PlayStateDto } from '../play-state/play-state.dto.js';
import { PlayState } from '../play-state/play-state.entity.js';

export enum OrderDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export enum MyListOrder {
  DateAdded = 'date-added',
  Name = 'name',
  FirstReleaseDate = 'first-release-date',
  LastReleaseDate = 'last-release-date',
  LastPlayed = 'last-played',
}

export enum MyListStatusFilter {
  All = 'all',
  Upcoming = 'upcoming',
  Unwatched = 'unwatched',
  Watched = 'watched',
  ContinueWatching = 'continue-watching',
}

export enum MyListTypeFilter {
  Movies = 'movies',
  Series = 'series',
  All = 'all',
}

export class MyListItemDto extends PickType(MyListItem, [
  'tmdbId',
  'mediaType',
  'playStates',
]) {
  @ApiProperty()
  tmdbItem: TmdbItemDto;

  @ApiProperty({ type: PlayStateDto, required: false })
  lastPlayState?: PlayState;

  @ApiProperty({ required: false })
  watched?: boolean;
}
