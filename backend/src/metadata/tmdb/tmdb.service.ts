import { Inject, Injectable } from '@nestjs/common';
import {
  TmdbEpisodeFull,
  TmdbMovieFull,
  TmdbSeasonFull,
  TmdbSeriesFull,
} from './tmdb.dto';
import { TMDB_API, TmdbApi } from './tmdb.providers';
import { TvSeasonDetailsDto } from './tmdb.v3.generated.dto';

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
}
