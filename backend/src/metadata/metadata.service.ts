import { Inject, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  EpisodeMetadata,
  MovieMetadata,
  SeriesMetadata,
} from './metadata.entity';
import { MOVIE_REPOSITORY, SERIES_REPOSITORY } from './metadata.providers';
import { TmdbService } from './tmdb/tmdb.service';
import { TmdbItemDto } from './tmdb/tmdb.dto';

@Injectable()
export class MetadataService {
  private logger = new Logger(MetadataService.name);
  // (TODO: Should use db locks instead of in-memory locks for multiple instance support)
  private updateLocks = new MetadataUpdateLock();

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

  async getMovieByTmdbId(
    tmdbId: string,
    eager = false,
  ): Promise<MovieMetadata | undefined> {
    const unlock = await this.updateLocks.acquire(tmdbId);

    let movie = await this.movieRepository.findOne({ where: { tmdbId } });
    const updatedAt = movie?.updatedAt;

    if (!movie || movie.needsUpdate()) {
      this.logger.debug(`Caching movie ${tmdbId}`);
      const p = this.tmdbService
        .getFullMovie(Number(tmdbId))
        .then(async (tmdbMovie) => {
          this.logger.debug(`Fetched movie data from TMDB for ${tmdbId}`);
          if (tmdbMovie) {
            if (!movie) {
              movie = MovieMetadata.from(tmdbMovie);
              await this.movieRepository
                .insert(movie)
                .catch((e) =>
                  this.logger.error(
                    `Failed to insert movie metadata for tmdbId ${tmdbId}`,
                    e.stack,
                  ),
                );
            } else {
              movie.updateFrom(tmdbMovie);
              await this.movieRepository
                .save(movie)
                .catch((e) =>
                  this.logger.error(
                    `Failed to update movie metadata for tmdbId ${tmdbId}`,
                    e.stack,
                  ),
                );
            }
          } else {
            this.logger.warn(
              `TMDB returned no data for movie with tmdbId ${tmdbId}`,
            );
          }

          if (!movie) {
            throw new Error(
              `Failed to fetch metadata for movie with tmdbId ${tmdbId}`,
            );
          }

          return movie;
        });

      if (!movie || eager) {
        await p;
      }
    }

    unlock();
    return movie;
  }

  async getSeriesByTmdbId(
    tmdbId: string,
    eager = false,
  ): Promise<SeriesMetadata | undefined> {
    const unlock = await this.updateLocks.acquire(tmdbId);

    let series = await this.seriesRepository.findOne({ where: { tmdbId } });
    const updatedAt = series?.updatedAt;

    if (!series || series.needsUpdate()) {
      this.logger.debug(`Caching series ${tmdbId}`);
      const p = this.tmdbService
        .getFullSeries(tmdbId)
        .then(async (tmdbSeries) => {
          this.logger.debug(`Fetched series data from TMDB for ${tmdbId}`);
          if (tmdbSeries) {
            if (!series) {
              series = SeriesMetadata.from(tmdbSeries);
              await this.seriesRepository
                .insert(series)
                .catch((e) =>
                  this.logger.error(
                    `Failed to insert series metadata for tmdbId ${tmdbId}`,
                    e.stack,
                  ),
                );
            } else {
              series.updateFrom(tmdbSeries);
              await this.seriesRepository
                .save(series)
                .catch((e) =>
                  this.logger.error(
                    `Failed to update series metadata for tmdbId ${tmdbId}`,
                    e.stack,
                  ),
                );
            }
          } else {
            this.logger.warn(
              `TMDB returned no data for series with tmdbId ${tmdbId}`,
            );
          }

          if (!series) {
            throw new Error(
              `Failed to fetch metadata for series with tmdbId ${tmdbId}`,
            );
          }

          return series;
        });

      if (!series || eager) {
        await p;
      }
    }

    unlock();
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

  async getBulkMoviesByTmdbIds(tmdbIds: string[]): Promise<any[]> {
    return [];
  }

  async getTmdbItem(tmdbId: string, mediaType: string): Promise<TmdbItemDto> {
    const movieMetadata =
      mediaType === 'movie'
        ? await this.getMovieByTmdbId(tmdbId, false)
        : undefined;
    const seriesMetadata =
      mediaType === 'series'
        ? await this.getSeriesByTmdbId(tmdbId, false)
        : undefined;

    return {
      id: movieMetadata?.tmdbMovie.id ?? seriesMetadata?.tmdbSeries.id,
      poster_path:
        movieMetadata?.tmdbMovie.poster_path ??
        seriesMetadata?.tmdbSeries.poster_path,
      vote_average:
        movieMetadata?.tmdbMovie.vote_average ??
        seriesMetadata?.tmdbSeries.vote_average,
      title: movieMetadata?.tmdbMovie.title,
      release_date: movieMetadata?.tmdbMovie.release_date,
      runtime: movieMetadata?.tmdbMovie.runtime,
      name: seriesMetadata?.tmdbSeries.name,
      first_air_date: seriesMetadata?.tmdbSeries.first_air_date,
      last_air_date: seriesMetadata?.tmdbSeries.last_air_date,
      next_episode_to_air: seriesMetadata?.tmdbSeries.next_episode_to_air,
      // seasons: seriesMetadata?.tmdbSeries.seasons,
    };
  }
}

class MetadataUpdateLock {
  private locks = new Map<string, Promise<any>>();

  async acquire(key: string) {
    if (this.locks.has(key)) {
      await this.locks.get(key);
    }

    let resolveFn: (value: any) => void;
    const promise = new Promise(async (resolve) => {
      resolveFn = resolve;
    });

    this.locks.set(key, promise);

    return () => {
      resolveFn(null);
      this.locks.delete(key);
    };
  }
}
