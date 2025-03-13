import { Inject, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MovieMetadata, SeriesMetadata } from './metadata.entity';
import { MOVIE_REPOSITORY, SERIES_REPOSITORY } from './metadata.providers';
import { TMDB_CACHE_TTL } from 'src/consts';
import { TMDB_API, TmdbApi } from './tmdb/tmdb.providers';
import { TmdbMovieFull } from './tmdb/tmdb.dto';
import { TmdbService } from './tmdb/tmdb.service';

@Injectable()
export class MetadataService {
  private logger = new Logger(MetadataService.name);

  constructor(
    @Inject(TMDB_API)
    private tmdbApi: TmdbApi,

    @Inject(MOVIE_REPOSITORY)
    private movieRepository: Repository<MovieMetadata>,

    @Inject(SERIES_REPOSITORY)
    private seriesRepository: Repository<SeriesMetadata>,

    private readonly tmdbService: TmdbService,
  ) {}

  async clearMetadataCache() {
    await this.movieRepository.clear();
    await this.seriesRepository.clear();
  }

  async getMovieByTmdbId(tmdbId: string): Promise<MovieMetadata | undefined> {
    let movie = await this.movieRepository.findOne({ where: { tmdbId } });

    if (!movie) {
      movie = new MovieMetadata();
      movie.tmdbId = tmdbId;
    }

    if (movie.isStale()) {
      const updatedMovie = this.tmdbService
        .getFullMovie(Number(tmdbId))
        .then(async (tmdbMovie) => {
          if (tmdbMovie) {
            movie.tmdbMovie = tmdbMovie;
            movie.updatedAt = new Date();
          }

          await this.movieRepository.upsert(movie, {
            conflictPaths: ['tmdbId'],
          });

          return movie;
        });

      if (movie.isOutdated()) return updatedMovie;
    }

    return movie;
  }

  async getBulkMoviesByTmdbIds(tmdbIds: string[]): Promise<any[]> {
    return [];
  }

  async getSeriesByTmdbId(tmdbId: string): Promise<SeriesMetadata | undefined> {
    let series = await this.seriesRepository.findOne({ where: { tmdbId } });

    if (!series) {
      series = new SeriesMetadata();
      series.tmdbId = tmdbId;
    }

    if (series.isStale()) {
      this.logger.debug(`Caching series ${tmdbId}`);
      const updatedSeries = this.tmdbService
        .getFullSeries(Number(tmdbId))
        .then(async (tmdbSeries) => {
          if (tmdbSeries) {
            series.tmdbSeries = tmdbSeries;
            series.updatedAt = new Date();
          }

          await this.seriesRepository.upsert(series, {
            conflictPaths: ['tmdbId'],
          });

          return series;
        });

      if (series.isOutdated()) return updatedSeries;
    }

    return series;
  }
}
