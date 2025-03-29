import { ApiProperty, PickType } from '@nestjs/swagger';
import { TmdbItemDto } from 'src/metadata/tmdb/tmdb.dto';
import { LibraryItem } from './library.entity';

export enum OrderDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export enum MyListOrder {
  DateAdded = 'date-added',
  Name = 'name',
  FirstReleaseDate = 'first-release-date',
  LastReleaseDate = 'last-release-date',
}

export enum MyListStatusFilter {
  All = 'all',
  Upcoming = 'upcoming',
  Unwatched = 'unwatched',
  Watched = 'watched',
  ContinueWatching = 'continueWatching',
}

export enum MyListTypeFilter {
  Movies = 'movies',
  Series = 'series',
  All = 'all',
}

export enum CatalogueFilter {
  All = 'all',
  Movies = 'movies',
  Series = 'series',
  Missing = 'missing',
}

export class LibraryItemDto extends PickType(LibraryItem, [
  'tmdbId',
  'mediaType',
  'playStates',
]) {
  @ApiProperty()
  tmdbItem: TmdbItemDto;

  @ApiProperty({ required: false })
  watched?: boolean;
}
