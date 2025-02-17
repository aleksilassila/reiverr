import { Inject, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Movie, Series } from './metadata.entity';
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
    private movieRepository: Repository<Movie>,

    @Inject(SERIES_REPOSITORY)
    private seriesRepository: Repository<Series>,

    private readonly tmdbService: TmdbService,
  ) {}

  async clearMetadataCache() {
    await this.movieRepository.clear();
    await this.seriesRepository.clear();
  }

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
      const tmdbMovie = await this.tmdbService.getFullMovie(Number(tmdbId));
      movie.tmdbMovie = tmdbMovie;
    }

    await this.movieRepository.save(movie);

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

    if (series.isStale()) {
      this.logger.debug(`Caching series ${tmdbId}`);
      const tmdbSeries = await this.tmdbService.getFullSeries(Number(tmdbId));
      if (tmdbSeries) series.tmdbSeries = tmdbSeries;
    }

    await this.seriesRepository.save(series);

    return series;
  }
}
