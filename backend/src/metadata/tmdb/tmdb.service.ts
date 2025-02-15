import { Inject, Injectable } from '@nestjs/common';
import { TmdbSeriesFull } from './tmdb.dto';
import { TMDB_API, TmdbApi } from './tmdb.providers';

@Injectable()
export class TmdbService {
  constructor(
    @Inject(TMDB_API)
    private tmdbApi: TmdbApi,
  ) {}

  async getFullSeries(tmdbId: number): Promise<TmdbSeriesFull> {
    const tmdbSeries = await this.tmdbApi.v3
      .tvSeriesDetails(Number(tmdbId))
      .then((r) => r.data);
    // .catch((e) => {
    //   console.error('could not get metadata for series', tmdbId, e);
    //   return e;
    // });

    return tmdbSeries;
  }
}
