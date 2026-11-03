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
import { TmdbItemDto } from './tmdb/tmdb.dto.js';

@Injectable()
export class MetadataService {
  private logger = new Logger(MetadataService.name);
  // Movies and series share TMDB ids. (TODO: In memory, so instances of the
  // server would each fetch a title)
  private movieFetches = new SingleFlight<MovieMetadata>();
  private seriesFetches = new SingleFlight<SeriesMetadata>();

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

    const movie = await this.findCachedMovie(this.em, tmdbId);
    if (movie && !movie.needsUpdate()) return movie;

    const fetched = this.movieFetches.run(tmdbId, () =>
      this.fetchMovie(tmdbId),
    );
    if (!movie) return fetched;

    // A cached document is still served when it cannot be refreshed
    const refreshed = fetched.catch((e) => {
      this.logger.warn(`Failed to refresh movie ${tmdbId}: ${e.message}`);
      return movie;
    });
    return eager ? refreshed : movie;
  }

  private async fetchMovie(tmdbId: string): Promise<MovieMetadata> {
    // A fetch that ended after the caller's read has cached it already
    let movie = await this.findCachedMovie(this.em, tmdbId);
    if (movie && !movie.needsUpdate()) return movie;

    this.logger.debug(`Caching movie ${tmdbId}`);
    const tmdbMovie = await this.tmdbService.getFullMovie(Number(tmdbId));
    if (!tmdbMovie) {
      throw new Error(`TMDB returned no data for movie with tmdbId ${tmdbId}`);
    }

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

    return movie;
  }

  async getSeriesByTmdbId(
    tmdbId: string,
    eager = false,
  ): Promise<SeriesMetadata | undefined> {
    if (!tmdbId) return undefined;

    const series = await this.findCachedSeries(this.em, tmdbId);
    if (series && !series.needsUpdate()) return series;

    const fetched = this.seriesFetches.run(tmdbId, () =>
      this.fetchSeries(tmdbId),
    );
    if (!series) return fetched;

    // A cached document is still served when it cannot be refreshed
    const refreshed = fetched.catch((e) => {
      this.logger.warn(`Failed to refresh series ${tmdbId}: ${e.message}`);
      return series;
    });
    return eager ? refreshed : series;
  }

  private async fetchSeries(tmdbId: string): Promise<SeriesMetadata> {
    // A fetch that ended after the caller's read has cached it already
    let series = await this.findCachedSeries(this.em, tmdbId);
    if (series && !series.needsUpdate()) return series;

    this.logger.debug(`Caching series ${tmdbId}`);
    const tmdbSeries = await this.tmdbService.getFullSeries(tmdbId);
    if (!tmdbSeries) {
      throw new Error(`TMDB returned no data for series with tmdbId ${tmdbId}`);
    }

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

    return series;
  }

  /**
   * The cached row of a movie; nothing is fetched. Read in the caller's
   * entity manager, as getEpisodeCounts, and kept out of its unit of work,
   * since the documents are large
   */
  findCachedMovie(
    em: EntityManager,
    tmdbId: string,
  ): Promise<MovieMetadata | null> {
    return em.findOne(MovieMetadata, { tmdbId }, { disableIdentityMap: true });
  }

  /** The cached row of a series; nothing is fetched. As findCachedMovie */
  findCachedSeries(
    em: EntityManager,
    tmdbId: string,
  ): Promise<SeriesMetadata | null> {
    return em.findOne(SeriesMetadata, { tmdbId }, { disableIdentityMap: true });
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

/** One run per key at a time: who asks during a run gets the result of that run */
export class SingleFlight<T> {
  private readonly runs = new Map<string, Promise<T>>();

  run(key: string, fn: () => Promise<T>): Promise<T> {
    const running = this.runs.get(key);
    if (running) return running;

    const run = fn().finally(() => this.runs.delete(key));
    this.runs.set(key, run);
    return run;
  }
}
