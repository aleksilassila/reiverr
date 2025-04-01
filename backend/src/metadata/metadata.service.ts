import { Inject, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  EpisodeMetadata,
  MovieMetadata,
  SeriesMetadata,
} from './metadata.entity';
import { MOVIE_REPOSITORY, SERIES_REPOSITORY } from './metadata.providers';
import { TmdbService } from './tmdb/tmdb.service';
import { TmdbEpisodeFull } from './tmdb/tmdb.dto';

@Injectable()
export class MetadataService {
  private logger = new Logger(MetadataService.name);

  constructor(
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
            movie.name = tmdbMovie.title;
            movie.releaseDate = tmdbMovie.release_date
              ? new Date(tmdbMovie.release_date)
              : undefined;
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
            series.firstReleaseDate = tmdbSeries.first_air_date
              ? new Date(tmdbSeries.first_air_date)
              : undefined;
            series.lastReleaseDate = tmdbSeries.last_air_date
              ? new Date(tmdbSeries.last_air_date)
              : undefined;
            series.nextReleaseDate = tmdbSeries.next_episode_to_air?.air_date
              ? new Date(tmdbSeries.next_episode_to_air.air_date)
              : undefined;
            series.lastEpisodeNumber =
              tmdbSeries.last_episode_to_air?.episode_number;
            series.lastSeasonNumber =
              tmdbSeries.last_episode_to_air?.season_number;
            series.name = tmdbSeries.name;
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

  /**
   * TODO: Use episode entities?
   */
  async getEpisodeByTmdbId(options: {
    tmdbId: string;
    season: number;
    episode: number;
  }): Promise<EpisodeMetadata | undefined> {
    const tmdbEpisode = await this.tmdbService.getFullEpisode(options);

    return {
      tmdbEpisode,
    };
  }
}
