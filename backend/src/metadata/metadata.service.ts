import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/sqlite';
import { Injectable, Logger } from '@nestjs/common';
import { MediaType, Title } from '../common/common.dto.js';
import {
  EpisodeMetadata,
  MovieMetadata,
  SeriesMetadata,
} from './metadata.entity.js';
import { TmdbService } from './tmdb/tmdb.service.js';
import { TmdbItemDto, TmdbMovieFull, TmdbSeriesFull } from './tmdb/tmdb.dto.js';

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
   * The cached document of a movie; nothing is fetched. Read in the
   * caller's entity manager, as getEpisodeCounts
   */
  async findCachedMovie(
    em: EntityManager,
    tmdbId: string,
  ): Promise<TmdbMovieFull | undefined> {
    const movie = await em.findOne(
      MovieMetadata,
      { tmdbId },
      { disableIdentityMap: true, fields: ['tmdbMovie'] },
    );

    return movie?.tmdbMovie;
  }

  /**
   * The cached document of a series; nothing is fetched. Read in the
   * caller's entity manager, as getEpisodeCounts
   */
  async findCachedSeries(
    em: EntityManager,
    tmdbId: string,
  ): Promise<TmdbSeriesFull | undefined> {
    const series = await em.findOne(
      SeriesMetadata,
      { tmdbId },
      { disableIdentityMap: true, fields: ['tmdbSeries'] },
    );

    return series?.tmdbSeries;
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

  /**
   * The items of the titles for the cards of the pages, by
   * `<media type>:<TMDB id>`, read off the columns of the cache in one
   * query per type. A title whose document is not cached is fetched
   * first, as its title page would. Read in the caller's entity manager
   */
  async findTmdbItems(
    em: EntityManager,
    titles: Title[],
  ): Promise<Map<string, TmdbItemDto>> {
    const cachedItems = await this.findCachedTmdbItems(em, titles);

    const missing = titles.filter((title) => !cachedItems.has(titleKey(title)));
    for (const { mediaType, tmdbId } of missing) {
      if (mediaType === MediaType.Movie) await this.getMovieByTmdbId(tmdbId);
      else await this.getSeriesByTmdbId(tmdbId);
    }
    for (const [key, item] of await this.findCachedTmdbItems(em, missing)) {
      cachedItems.set(key, item);
    }
    for (const title of missing) {
      if (!cachedItems.has(titleKey(title))) {
        throw new Error(`No document for ${title.mediaType} ${title.tmdbId}`);
      }
    }

    return cachedItems;
  }

  /** The items of the titles the cache has, by key */
  private async findCachedTmdbItems(
    em: EntityManager,
    titles: Title[],
  ): Promise<Map<string, TmdbItemDto>> {
    const items = new Map<string, TmdbItemDto>();
    const idsOf = (mediaType: MediaType) =>
      titles
        .filter((title) => title.mediaType === mediaType)
        .map((title) => title.tmdbId);

    const movieIds = idsOf(MediaType.Movie);
    if (movieIds.length) {
      const movies = await em.find(
        MovieMetadata,
        { tmdbId: { $in: movieIds } },
        {
          disableIdentityMap: true,
          fields: ['tmdbId', 'name', 'posterPath', 'runtime'],
        },
      );
      for (const movie of movies) {
        items.set(`${MediaType.Movie}:${movie.tmdbId}`, {
          id: Number(movie.tmdbId),
          poster_path: movie.posterPath,
          title: movie.name,
          runtime: movie.runtime,
        });
      }
    }

    const seriesIds = idsOf(MediaType.Series);
    if (seriesIds.length) {
      const series = await em.find(
        SeriesMetadata,
        { tmdbId: { $in: seriesIds } },
        { disableIdentityMap: true, fields: ['tmdbId', 'name', 'posterPath'] },
      );
      for (const row of series) {
        items.set(`${MediaType.Series}:${row.tmdbId}`, {
          id: Number(row.tmdbId),
          poster_path: row.posterPath,
          name: row.name,
        });
      }
    }

    return items;
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
}

const titleKey = ({ mediaType, tmdbId }: Title) => `${mediaType}:${tmdbId}`;

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
