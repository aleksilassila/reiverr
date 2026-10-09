import { Inject, Injectable } from '@nestjs/common';
import { MediaType } from '../../common/common.dto.js';
import {
  TmdbEpisodeFull,
  TmdbMovieFull,
  TmdbSeasonFull,
  TmdbSeriesFull,
} from './tmdb.dto.js';
import { TMDB_API, type TmdbApi } from './tmdb.providers.js';
import { TvSeasonDetailsDto } from './tmdb.v3.generated.dto.js';

@Injectable()
export class TmdbService {
  constructor(
    @Inject(TMDB_API)
    private tmdbApi: TmdbApi,
  ) {}

  async getFullMovie(tmdbId: number) {
    return this.tmdbApi.v3
      .movieDetails(Number(tmdbId), {
        append_to_response: 'videos,credits,external_ids,images',
      })
      .then((r) => r.data as TmdbMovieFull);
  }

  async getFullSeries(tmdbId: string): Promise<TmdbSeriesFull> {
    const tmdbSeries = await this.tmdbApi.v3
      .tvSeriesDetails(Number(tmdbId), {
        append_to_response: 'videos,aggregate_credits,external_ids,images',
      })
      .then((r) => r.data as TmdbSeriesFull);
    // .catch((e) => {
    //   console.error('could not get metadata for series', tmdbId, e);
    //   return e;
    // });

    const seasons = tmdbSeries?.seasons
      ?.filter(
        (s) =>
          !s.name?.toLocaleLowerCase()?.includes('special') &&
          s.season_number !== 0,
      )
      ?.map((season) =>
        this.getFullSeason({ tmdbId, season: season.season_number! }),
      );
    tmdbSeries.seasons = await Promise.all(seasons);

    return tmdbSeries;
  }

  async getFullSeason(options: {
    tmdbId: string;
    season: number;
  }): Promise<TmdbSeasonFull> {
    return this.tmdbApi.v3
      .tvSeasonDetails(Number(options.tmdbId), options.season, {
        append_to_response: 'aggregate_credits',
      })
      .then((r) => r.data as TmdbSeasonFull);
  }

  async getFullEpisode(options: {
    tmdbId: string;
    season: number;
    episode: number;
  }) {
    return this.tmdbApi.v3
      .tvEpisodeDetails(
        Number(options.tmdbId),
        options.season,
        options.episode,
        // {
        //   append_to_response: 'videos,credits,external_ids,images',
        // },
      )
      .then((r) => r.data as TmdbEpisodeFull);
  }

  /** The titles TMDB finds for a name, of the first year when it is known */
  async searchTitles(
    mediaType: MediaType,
    query: string,
    year?: number,
  ): Promise<TmdbTitleSummary[]> {
    if (mediaType === MediaType.Movie) {
      const { results } = await this.tmdbApi.v3
        .searchMovie({ query, primary_release_year: year?.toString() })
        .then((r) => r.data);

      return (results ?? []).map((movie) => ({
        tmdbId: String(movie.id),
        titles: [movie.title, movie.original_title],
        date: movie.release_date,
      }));
    }

    const { results } = await this.tmdbApi.v3
      .searchTv({ query, first_air_date_year: year })
      .then((r) => r.data);

    return (results ?? []).map((series) => ({
      tmdbId: String(series.id),
      titles: [series.name, series.original_name],
      date: series.first_air_date,
    }));
  }

  /** The title TMDB knows by an IMDb or TVDB id, if any */
  async findByExternalId(
    mediaType: MediaType,
    source: 'imdb_id' | 'tvdb_id',
    id: string,
  ): Promise<TmdbTitleSummary | undefined> {
    const found = await this.tmdbApi.v3
      .findById(id, { external_source: source })
      .then((r) => r.data);

    if (mediaType === MediaType.Movie) {
      const movie = found.movie_results?.[0];

      return (
        movie && {
          tmdbId: String(movie.id),
          titles: [movie.title, movie.original_title],
          date: movie.release_date,
        }
      );
    }

    const series = found.tv_results?.[0];

    return (
      series && {
        tmdbId: String(series.id),
        titles: [series.name, series.original_name],
        date: series.first_air_date,
      }
    );
  }
}

/** What a search result tells of a title */
export interface TmdbTitleSummary {
  tmdbId: string;
  titles: (string | undefined)[];
  /** The release or first air date */
  date?: string;
}
