import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/sqlite';
import { Injectable, Logger } from '@nestjs/common';
import {
  EpisodeMetadata,
  MovieMetadata,
  SeriesMetadata,
} from './metadata.entity.js';
import { TmdbService } from './tmdb/tmdb.service.js';
import { TmdbItemDto } from './tmdb/tmdb.dto.js';

@Injectable()
export class MetadataService {
  private logger = new Logger(MetadataService.name);
  // (TODO: Should use db locks instead of in-memory locks for multiple instance support)
  private updateLocks = new MetadataUpdateLock();

  constructor(
    @InjectRepository(MovieMetadata)
    private movieRepository: EntityRepository<MovieMetadata>,

    @InjectRepository(SeriesMetadata)
    private seriesRepository: EntityRepository<SeriesMetadata>,

    private readonly em: EntityManager,
    private readonly tmdbService: TmdbService,
  ) {}

  async clearMetadataCache() {
    await this.movieRepository.nativeDelete({});
    await this.seriesRepository.nativeDelete({});
  }

  async getMovieByTmdbId(
    tmdbId: string,
    eager = false,
  ): Promise<MovieMetadata | undefined> {
    if (!tmdbId) return undefined;

    // Movies and series share TMDB ids
    const unlock = await this.updateLocks.acquire(`movie:${tmdbId}`);

    try {
      // The cached documents are large, so they are kept out of the unit of work
      let movie = await this.movieRepository.findOne(
        { tmdbId },
        { disableIdentityMap: true },
      );
      const updatedAt = movie?.updatedAt;

      if (!movie || movie.needsUpdate()) {
        this.logger.debug(`Caching movie ${tmdbId}`);
        const cached = !!movie;
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
                await this.em
                  .upsert(movie)
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

        // A cached document is still served when it cannot be refreshed
        const refresh = cached
          ? p.catch((e) =>
              this.logger.warn(
                `Failed to refresh movie ${tmdbId}: ${e.message}`,
              ),
            )
          : p;

        if (!cached || eager) {
          await refresh;
        }
      }

      return movie;
    } finally {
      unlock();
    }
  }

  async getSeriesByTmdbId(
    tmdbId: string,
    eager = false,
  ): Promise<SeriesMetadata | undefined> {
    if (!tmdbId) return undefined;

    const unlock = await this.updateLocks.acquire(`series:${tmdbId}`);

    try {
      let series = await this.seriesRepository.findOne(
        { tmdbId },
        { disableIdentityMap: true },
      );
      const updatedAt = series?.updatedAt;

      if (!series || series.needsUpdate()) {
        this.logger.debug(`Caching series ${tmdbId}`);
        const cached = !!series;
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
                await this.em
                  .upsert(series)
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

        // A cached document is still served when it cannot be refreshed
        const refresh = cached
          ? p.catch((e) =>
              this.logger.warn(
                `Failed to refresh series ${tmdbId}: ${e.message}`,
              ),
            )
          : p;

        if (!cached || eager) {
          await refresh;
        }
      }

      return series;
    } finally {
      unlock();
    }
  }

  /**
   * TODO: Use episode entities?
   */
  /**
   * How many episodes every season of a series has, as the cache says;
   * nothing is fetched. Read in the caller's entity manager: inside a
   * transaction, a read on this service's own would wait on the
   * transaction and never return
   */
  async getEpisodeCounts(
    em: EntityManager,
    tmdbId: string,
  ): Promise<Map<number, number>> {
    const series = await em.findOne(
      SeriesMetadata,
      { tmdbId },
      { disableIdentityMap: true, fields: ['tmdbSeries'] },
    );

    return new Map(
      (series?.tmdbSeries.seasons ?? []).map((season) => [
        season.season_number,
        season.episodes?.length ?? 0,
      ]),
    );
  }

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

/** One holder per key at a time, the others wait in the order they came */
export class MetadataUpdateLock {
  private readonly tails = new Map<string, Promise<void>>();

  async acquire(key: string): Promise<() => void> {
    const previous = this.tails.get(key) ?? Promise.resolve();
    let release: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    const tail = previous.then(() => held);
    this.tails.set(key, tail);

    await previous;

    return () => {
      release();
      if (this.tails.get(key) === tail) this.tails.delete(key);
    };
  }
}
