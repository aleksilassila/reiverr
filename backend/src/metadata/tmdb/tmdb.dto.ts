import { ApiProperty } from '@nestjs/swagger';
import { TmdbApi } from './tmdb.providers';
import {
  MovieCreditsDto,
  MovieDetailsDto,
  MovieExternalIdsDto,
  MovieImagesDto,
  MovieVideosDto,
  SeasonDto,
  TvSeasonDetailsDto,
  TvSeriesAggregateCreditsDto,
  TvSeriesDetailsDto,
  TvSeriesExternalIdsDto,
  TvSeriesImagesDto,
  TvSeriesVideosDto,
} from './tmdb.v3.generated.dto';

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

export type TmdbEpisode = Awaited<
  ReturnType<TmdbApi['v3']['tvEpisodeDetails']>
>['data'];

// export type TmdbMovieFull = TmdbMovie & {
//   videos: MovieVideos; // Proxy or to not proxy
//   credits: MovieCredits;
//   external_ids: MovieExternalIds;
//   images: MovieImages;
// };

export class TmdbMovieFull extends MovieDetailsDto {
  @ApiProperty({ required: false })
  videos?: MovieVideosDto;

  @ApiProperty({ required: false })
  credits?: MovieCreditsDto;

  @ApiProperty({ required: false })
  external_ids?: MovieExternalIdsDto;

  @ApiProperty({ required: false })
  images?: MovieImagesDto;
}

// export type TmdbSeriesFull = TmdbSeries & {
//   videos: SeriesVideos;
//   aggregate_credits: SeriesCredits;
//   external_ids: SeriesExternalIds;
//   images: SeriesImages;
// };

class NextEpisodeToAir {
  @ApiProperty({ required: false })
  air_date?: string;
}

export class TmdbSeasonFull extends TvSeasonDetailsDto {
  @ApiProperty({ required: false })
  aggregate_credits?: TvSeriesAggregateCreditsDto;
}

export class TmdbSeriesFull extends TvSeriesDetailsDto {
  @ApiProperty({ required: false })
  videos?: TvSeriesVideosDto;

  @ApiProperty({ required: false })
  aggregate_credits?: TvSeriesAggregateCreditsDto;

  @ApiProperty({ required: false })
  external_ids?: TvSeriesExternalIdsDto;

  @ApiProperty({ required: false })
  images?: TvSeriesImagesDto;

  @ApiProperty({ required: false, type: NextEpisodeToAir })
  next_episode_to_air?: NextEpisodeToAir;

  @ApiProperty({ required: false, type: [TmdbSeasonFull] })
  seasons?: TmdbSeasonFull[];
}

export type TmdbEpisodeFull = TmdbEpisode;

// class Season {
//   @ApiProperty({ required: false })
//   air_date?: string;

//   @ApiProperty({ required: false })
//   episode_count?: number;

//   @ApiProperty({ required: false })
//   id?: number;

//   @ApiProperty({ required: false })
//   name?: string;

//   @ApiProperty({ required: false })
//   overview?: string;

//   @ApiProperty({ required: false })
//   poster_path?: string;

//   @ApiProperty({ required: false })
//   season_number?: number;

//   @ApiProperty({ required: false })
//   vote_average?: number;
// }

/**
 * Basically TmdbSeriesSmall + TmdbMovieSmall, used to render cards in catalogues
 */
export class TmdbItemDto implements MovieDetailsDto, TvSeriesDetailsDto {
  // TmdbMovie & TmdbSeries

  @ApiProperty({ required: false })
  id?: number;

  @ApiProperty({ required: false })
  poster_path?: string;

  @ApiProperty({ required: false })
  vote_average?: number;

  // TmdbMovie only, therefore optional

  @ApiProperty({ required: false })
  title?: string;

  @ApiProperty({ required: false })
  release_date?: string;

  @ApiProperty({ required: false })
  runtime?: number;

  // TmdbSeries only, therefore optional

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  first_air_date?: string;

  @ApiProperty({ required: false })
  last_air_date?: string;

  @ApiProperty({ required: false, type: NextEpisodeToAir })
  next_episode_to_air?: NextEpisodeToAir;

  @ApiProperty({ required: false, type: [SeasonDto] })
  seasons?: SeasonDto[];
}
