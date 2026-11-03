import { MikroORM } from '@mikro-orm/sqlite';
import { Logger } from '@nestjs/common';
import { MediaType } from '../common/common.dto.js';
import { TMDB_CACHE_TTL } from '../consts.js';
import mikroOrmConfig from '../mikro-orm.config.js';
import { MovieMetadata, SeriesMetadata } from './metadata.entity.js';
import { MetadataService, SingleFlight } from './metadata.service.js';
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

  it('fetches a title once for the callers that ask for it at the same time', async () => {
    tmdb.getFullMovie.mockResolvedValue(movie('Movie'));
    tmdb.getFullSeries.mockResolvedValue(series('Series'));

    const documents = await Promise.all([
      metadata.getMovieByTmdbId('1'),
      metadata.getMovieByTmdbId('1'),
      metadata.getSeriesByTmdbId('1'),
      metadata.getSeriesByTmdbId('1'),
    ]);

    expect(documents.map((document) => document.name)).toEqual([
      'Movie',
      'Movie',
      'Series',
      'Series',
    ]);
    expect(tmdb.getFullMovie).toHaveBeenCalledTimes(1);
    expect(tmdb.getFullSeries).toHaveBeenCalledTimes(1);
  });

  it('refreshes a stale document once for the callers that ask during the refresh', async () => {
    await cacheStale(SeriesMetadata.from(series('Cached series')));
    let respond: (tmdbSeries: TmdbSeriesFull) => void;
    tmdb.getFullSeries.mockReturnValue(
      new Promise((resolve) => (respond = resolve)),
    );

    expect((await metadata.getSeriesByTmdbId('1')).name).toBe('Cached series');
    expect((await metadata.getSeriesByTmdbId('1')).name).toBe('Cached series');
    const refreshed = metadata.getSeriesByTmdbId('1', true);
    respond(series('New series'));

    expect((await refreshed).name).toBe('New series');
    expect(tmdb.getFullSeries).toHaveBeenCalledTimes(1);
  });

  it('reads the items of the cached titles in one go and fetches the uncached first', async () => {
    await orm.em.fork().insert(
      MovieMetadata.from({
        ...movie('Cached movie'),
        poster_path: '/movie.jpg',
        runtime: 90,
      } as TmdbMovieFull),
    );
    await orm.em.fork().insert(
      SeriesMetadata.from({
        ...series('Cached series'),
        poster_path: '/series.jpg',
      } as TmdbSeriesFull),
    );
    tmdb.getFullMovie.mockResolvedValueOnce({
      ...movie('Fetched movie'),
      id: 2,
    } as TmdbMovieFull);

    const items = await metadata.findTmdbItems(orm.em.fork(), [
      { mediaType: MediaType.Movie, tmdbId: '1' },
      { mediaType: MediaType.Series, tmdbId: '1' },
      { mediaType: MediaType.Movie, tmdbId: '2' },
    ]);

    expect(items.get('movie:1')).toMatchObject({
      id: 1,
      poster_path: '/movie.jpg',
      title: 'Cached movie',
      runtime: 90,
    });
    expect(items.get('series:1')).toMatchObject({
      id: 1,
      name: 'Cached series',
      poster_path: '/series.jpg',
    });
    expect(items.get('movie:2')).toMatchObject({
      id: 2,
      title: 'Fetched movie',
    });
    expect(tmdb.getFullMovie).toHaveBeenCalledTimes(1);
    expect(tmdb.getFullSeries).not.toHaveBeenCalled();
  });

  it('fails for a title whose document cannot be had', async () => {
    tmdb.getFullSeries.mockRejectedValueOnce(new Error('TMDB is down'));

    await expect(
      metadata.findTmdbItems(orm.em.fork(), [
        { mediaType: MediaType.Series, tmdbId: '1' },
      ]),
    ).rejects.toThrow('TMDB is down');
  });
});

describe('SingleFlight', () => {
  it('runs a key once at a time and gives the result of the run to whoever asks during it', async () => {
    const flights = new SingleFlight<string>();
    const run = vi.fn(async (value: string) => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return value;
    });

    const results = await Promise.all([
      flights.run('1', () => run('a')),
      flights.run('1', () => run('b')),
      flights.run('2', () => run('c')),
    ]);

    expect(results).toEqual(['a', 'a', 'c']);
    // A key runs again once its run has ended
    expect(await flights.run('1', () => run('d'))).toBe('d');
    expect(run).toHaveBeenCalledTimes(3);
  });

  it('gives the failure of a run to whoever asks during it, and runs again afterwards', async () => {
    const flights = new SingleFlight<string>();

    const failed = flights.run('1', async () => {
      throw new Error('Failed');
    });
    const joined = flights.run('1', async () => 'not run');

    await expect(failed).rejects.toThrow('Failed');
    await expect(joined).rejects.toThrow('Failed');
    expect(await flights.run('1', async () => 'ran')).toBe('ran');
  });
});
