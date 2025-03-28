import { ApiProperty, PickType } from '@nestjs/swagger';
import { TmdbItemDto } from 'src/metadata/tmdb/tmdb.dto';
import { LibraryItem } from './library.entity';

export enum SortByDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export enum MyListSortBy {
  DateAdded = 'dateAdded',
  Name = 'name',
  FirstReleaseDate = 'firstReleaseDate',
  LastReleaseDate = 'lastReleaseDate',
}

export enum MyListFilter {
  Movie = 'movie',
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
