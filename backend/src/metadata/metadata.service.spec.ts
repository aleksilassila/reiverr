import { MikroORM } from '@mikro-orm/sqlite';
import { Logger } from '@nestjs/common';
import { TMDB_CACHE_TTL } from '../consts.js';
import mikroOrmConfig from '../mikro-orm.config.js';
import { MovieMetadata, SeriesMetadata } from './metadata.entity.js';
import { MetadataService, MetadataUpdateLock } from './metadata.service.js';
import { TmdbMovieFull, TmdbSeriesFull } from './tmdb/tmdb.dto.js';
import { TmdbService } from './tmdb/tmdb.service.js';

describe('MetadataService', () => {
  let orm: MikroORM;
  let metadata: MetadataService;

  const tmdb = { getFullMovie: vi.fn(), getFullSeries: vi.fn() };
  const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

  const movie = (title: string) => ({ id: 1, title }) as TmdbMovieFull;
  const series = (name: string) =>
    ({ id: 1, name, seasons: [] }) as TmdbSeriesFull;

  async function cacheStale(entity: MovieMetadata | SeriesMetadata) {
    entity.updatedAt = new Date(Date.now() - TMDB_CACHE_TTL - 1000);
    await orm.em.fork().insert(entity);
  }

  beforeEach(async () => {
    orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
    await orm.migrator.up();

    const em = orm.em.fork();
    metadata = new MetadataService(
      em.getRepository(MovieMetadata),
      em.getRepository(SeriesMetadata),
      em,
      tmdb as unknown as TmdbService,
    );

    vi.clearAllMocks();
  });

  afterEach(() => orm.close());

  it('fails for an uncached title that cannot be fetched, and works again afterwards', async () => {
    tmdb.getFullMovie.mockRejectedValueOnce(new Error('TMDB is down'));
    tmdb.getFullSeries.mockRejectedValueOnce(new Error('TMDB is down'));
    await expect(metadata.getMovieByTmdbId('1')).rejects.toThrow(
      'TMDB is down',
    );
    await expect(metadata.getSeriesByTmdbId('1')).rejects.toThrow(
      'TMDB is down',
    );

    tmdb.getFullMovie.mockResolvedValueOnce(movie('Movie'));
    tmdb.getFullSeries.mockResolvedValueOnce(series('Series'));
    expect((await metadata.getMovieByTmdbId('1')).name).toBe('Movie');
    expect((await metadata.getSeriesByTmdbId('1')).name).toBe('Series');
  });

  it('serves the cached document while a refresh in the background fails', async () => {
    await cacheStale(MovieMetadata.from(movie('Cached movie')));
    await cacheStale(SeriesMetadata.from(series('Cached series')));
    tmdb.getFullMovie.mockRejectedValue(new Error('TMDB is down'));
    tmdb.getFullSeries.mockRejectedValue(new Error('TMDB is down'));

    expect((await metadata.getMovieByTmdbId('1')).name).toBe('Cached movie');
    expect((await metadata.getSeriesByTmdbId('1')).name).toBe('Cached series');
    await vi.waitFor(() => expect(warn).toHaveBeenCalledTimes(2));
  });

  it('serves the cached document when an eager refresh fails', async () => {
    await cacheStale(MovieMetadata.from(movie('Cached movie')));
    await cacheStale(SeriesMetadata.from(series('Cached series')));
    tmdb.getFullMovie.mockRejectedValue(new Error('TMDB is down'));
    tmdb.getFullSeries.mockRejectedValue(new Error('TMDB is down'));

    expect((await metadata.getMovieByTmdbId('1', true)).name).toBe(
      'Cached movie',
    );
    expect((await metadata.getSeriesByTmdbId('1', true)).name).toBe(
      'Cached series',
    );
  });

  it('refreshes a stale document', async () => {
    await cacheStale(MovieMetadata.from(movie('Cached movie')));
    await cacheStale(SeriesMetadata.from(series('Cached series')));
    tmdb.getFullMovie.mockResolvedValue(movie('New movie'));
    tmdb.getFullSeries.mockResolvedValue(series('New series'));

    expect((await metadata.getMovieByTmdbId('1', true)).name).toBe('New movie');
    expect((await metadata.getSeriesByTmdbId('1', true)).name).toBe(
      'New series',
    );
    expect((await metadata.getMovieByTmdbId('1')).name).toBe('New movie');
    expect((await metadata.getSeriesByTmdbId('1')).name).toBe('New series');
    expect(tmdb.getFullMovie).toHaveBeenCalledTimes(1);
    expect(tmdb.getFullSeries).toHaveBeenCalledTimes(1);
  });
});

describe('MetadataUpdateLock', () => {
  it('lets one holder of a key in at a time, in the order they came', async () => {
    const lock = new MetadataUpdateLock();
    const order: string[] = [];
    const hold = async (name: string, key = 'series:1') => {
      const unlock = await lock.acquire(key);
      order.push(`${name} in`);
      await new Promise((resolve) => setTimeout(resolve, 5));
      order.push(`${name} out`);
      unlock();
    };

    await Promise.all([hold('a'), hold('b'), hold('c'), hold('d', 'movie:1')]);

    expect(order.filter((step) => !step.startsWith('d'))).toEqual([
      'a in',
      'a out',
      'b in',
      'b out',
      'c in',
      'c out',
    ]);
    // Another key does not wait
    expect(order.indexOf('d in')).toBeLessThan(order.indexOf('a out'));
  });
});
