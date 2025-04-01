import { Inject, Injectable } from '@nestjs/common';
import { TmdbEpisodeFull, TmdbMovieFull, TmdbSeriesFull } from './tmdb.dto';
import { TMDB_API, TmdbApi } from './tmdb.providers';

@Injectable()
export class TmdbService {
  constructor(
    @Inject(TMDB_API)
    private tmdbApi: TmdbApi,
  ) {}

  async getFullSeries(tmdbId: number): Promise<TmdbSeriesFull> {
    const tmdbSeries = await this.tmdbApi.v3
      .tvSeriesDetails(Number(tmdbId), {
        append_to_response: 'videos,aggregate_credits,external_ids,images',
      })
      .then((r) => r.data as TmdbSeriesFull);
    // .catch((e) => {
    //   console.error('could not get metadata for series', tmdbId, e);
    //   return e;
    // });

    return tmdbSeries;
  }

  async getFullMovie(tmdbId: number) {
    return this.tmdbApi.v3
      .movieDetails(Number(tmdbId), {
        append_to_response: 'videos,credits,external_ids,images',
      })
      .then((r) => r.data as TmdbMovieFull);
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
