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
