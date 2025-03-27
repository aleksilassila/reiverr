import { ApiProperty } from '@nestjs/swagger';
import { TmdbApi } from './tmdb.providers';

export type MovieVideos = Awaited<
  ReturnType<TmdbApi['v3']['movieVideos']>
>['data'];
export type MovieCredits = Awaited<
  ReturnType<TmdbApi['v3']['movieCredits']>
>['data'];
export type MovieExternalIds = Awaited<
  ReturnType<TmdbApi['v3']['movieExternalIds']>
>['data'];
export type MovieImages = Awaited<
  ReturnType<TmdbApi['v3']['movieImages']>
>['data'];
export type TmdbMovie = Awaited<
  ReturnType<TmdbApi['v3']['movieDetails']>
>['data'];

export type SeriesVideos = Awaited<
  ReturnType<TmdbApi['v3']['tvSeriesVideos']>
>['data'];
export type SeriesCredits = Awaited<
  ReturnType<TmdbApi['v3']['tvSeriesAggregateCredits']>
>['data'];
export type SeriesExternalIds = Awaited<
  ReturnType<TmdbApi['v3']['tvSeriesExternalIds']>
>['data'];
export type SeriesImages = Awaited<
  ReturnType<TmdbApi['v3']['tvSeriesImages']>
>['data'];
export type TmdbSeries = Awaited<
  ReturnType<TmdbApi['v3']['tvSeriesDetails']>
>['data'];

export type TmdbMovieFull = TmdbMovie & {
  videos: MovieVideos; // Proxy or to not proxy
  credits: MovieCredits;
  external_ids: MovieExternalIds;
  images: MovieImages;
};

export type TmdbSeriesFull = TmdbSeries & {
  videos: SeriesVideos;
  aggregate_credits: SeriesCredits;
  external_ids: SeriesExternalIds;
  images: SeriesImages;
};

class NextEpisodeToAir {
  @ApiProperty({ required: false })
  air_date?: string;
}

class Season {
  @ApiProperty({ required: false })
  air_date?: string;

  @ApiProperty({ required: false })
  episode_count?: number;

  @ApiProperty({ required: false })
  id?: number;

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  overview?: string;

  @ApiProperty({ required: false })
  poster_path?: string;

  @ApiProperty({ required: false })
  season_number?: number;

  @ApiProperty({ required: false })
  vote_average?: number;
}

export class TmdbItemDto implements TmdbMovie, TmdbSeries {
  // TmdbMovie & TmdbSeries

  @ApiProperty({ required: false })
  id?: number;

  @ApiProperty({ required: false })
  poster_path?: string;

  @ApiProperty({ required: false })
  vote_average?: number;

  // TmdbMovie only

  @ApiProperty({ required: false })
  title?: string;

  @ApiProperty({ required: false })
  release_date?: string;

  @ApiProperty({ required: false })
  runtime?: number;

  // TmdbSeries only

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  first_air_date?: string;

  @ApiProperty({ required: false })
  last_air_date?: string;

  @ApiProperty({ required: false, type: NextEpisodeToAir })
  next_episode_to_air?: NextEpisodeToAir;

  @ApiProperty({ required: false, isArray: true, type: Season })
  seasons?: Season[];
}
