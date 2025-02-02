import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Movie, Series } from './metadata.entity';
import { MOVIE_REPOSITORY, SERIES_REPOSITORY } from './metadata.providers';
import { TMDB_CACHE_TTL } from 'src/consts';
import { TMDB_API, TmdbApi } from './tmdb/tmdb.providers';
import { TmdbMovieFull } from './tmdb/tmdb.dto';

@Injectable()
export class MetadataService {
  constructor(
    @Inject(TMDB_API)
    private tmdbApi: TmdbApi,

    @Inject(MOVIE_REPOSITORY)
    private movieRepository: Repository<Movie>,

    @Inject(SERIES_REPOSITORY)
    private seriesRepository: Repository<Series>,
  ) {}

  async getMovieByTmdbId(tmdbId: string): Promise<Movie | undefined> {
    let movie = await this.movieRepository.findOne({ where: { tmdbId } });

    if (!movie) {
      movie = new Movie();
      movie.tmdbId = tmdbId;
    }

    if (
      !movie.updatedAt ||
      new Date().getTime() - movie.updatedAt.getTime() > TMDB_CACHE_TTL
    ) {
      const tmdbMovie = await this.tmdbApi.v3
        .movieDetails(Number(tmdbId), {
          append_to_response: 'videos,credits,external_ids,images',
        })
        .then((r) => r.data as TmdbMovieFull);
      movie.tmdbMovie = tmdbMovie;
    }

    return movie;
  }

  async getBulkMoviesByTmdbIds(tmdbIds: string[]): Promise<any[]> {
    return [];
  }

  async getSeriesByTmdbId(tmdbId: string): Promise<Series | undefined> {
    let series = await this.seriesRepository.findOne({ where: { tmdbId } });

    if (!series) {
      series = new Series();
      series.tmdbId = tmdbId;
    }

    if (
      !series.updatedAt ||
      new Date().getTime() - series.updatedAt.getTime() > TMDB_CACHE_TTL
    ) {
      const tmdbSeries = await this.tmdbApi.v3
        .tvSeriesDetails(Number(tmdbId))
        .then((r) => r.data)
        .catch((e) => {
          console.error('could not get metadata for series', tmdbId, e);
          return e;
        });
      series.tmdbSeries = tmdbSeries;
    }

    return series;
  }
}
