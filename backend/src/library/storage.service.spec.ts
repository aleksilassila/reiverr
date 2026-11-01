import { RequestContext } from '@mikro-orm/core';
import { EntityManager, MikroORM } from '@mikro-orm/sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import {
  Letter,
  MediaType,
  MediaTypeFull,
  OrderDirection,
} from '../common/common.dto.js';
import { IndexersService } from '../indexers/indexers.service.js';
import { EventsService } from '../events/events.service.js';
import { JobsService } from '../jobs/jobs.service.js';
import { MovieMetadata, SeriesMetadata } from '../metadata/metadata.entity.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { TmdbMovieFull, TmdbSeriesFull } from '../metadata/tmdb/tmdb.dto.js';
import mikroOrmConfig from '../mikro-orm.config.js';
import { RequestRule } from '../requests/request-rule.entity.js';
import { MediaRequest } from '../requests/request.entity.js';
import { RequestsService } from '../requests/requests.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { User } from '../users/user.entity.js';
import { UsersService } from '../users/users.service.js';
import {
  CleanupSchedule,
  TitleUsageSort,
  TitleUsageStatus,
} from './library.dto.js';
import { MediaFile } from './media-file.entity.js';
import { RequestBinding } from './request-binding.entity.js';
import { expectedBytes, roomFor, StorageService } from './storage.service.js';

describe('roomFor', () => {
  const usage = { heldBytes: 60, pendingBytes: 30 };
  const gate = (quota: number | null, diskFull = false) => ({
    usage,
    quota,
    diskFull,
  });

  it('lets a request through within the quota, or without one', () => {
    expect(roomFor(gate(null), { bytes: 1000, download: true })).toBe('ok');
    expect(roomFor(gate(100), { bytes: 10, download: true })).toBe('ok');
    expect(roomFor(gate(100), { bytes: 11, download: false })).toBe(
      'over-quota',
    );
  });

  it('holds back a download while a disk is at the limit, and a file in the library not', () => {
    expect(roomFor(gate(null, true), { bytes: 10, download: true })).toBe(
      'disk-full',
    );
    expect(roomFor(gate(null, true), { bytes: 10, download: false })).toBe(
      'ok',
    );
    // The quota is what the user can do something about
    expect(roomFor(gate(100, true), { bytes: 11, download: true })).toBe(
      'over-quota',
    );
  });
});

describe('expectedBytes', () => {
  it('is the release for a torrent picked for the episode, else its share of the season', () => {
    expect(expectedBytes(200, true, 3)).toBe(200);
    expect(expectedBytes(200, false, 3)).toBe(67);
    expect(expectedBytes(200, false, undefined)).toBe(200);
    expect(expectedBytes(200, false, 0)).toBe(200);
  });
});

describe('StorageService', () => {
  let root: string;

  /** The service with a library folder that is there and a movie folder that is not, and no users or requests */
  const service = (maxDiskUsagePercent: number | null) =>
    new StorageService(
      { fork: () => ({}) } as unknown as EntityManager,
      { findRequests: async () => [] } as unknown as RequestsService,
      { findQuotas: async () => [] } as unknown as UsersService,
      {
        getOrCreateValue: async () => ({
          movieFolders: { [path.join(root, 'missing')]: { primary: true } },
          seriesFolders: { [root]: { primary: true } },
          cleanup: CleanupSchedule.Daily,
          maxDiskUsagePercent,
        }),
      } as unknown as SettingsService,
      {} as unknown as MetadataService,
    );

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'reiverr-storage-'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('measures the disks of the folders that are there', async () => {
    const { disks } = await service(null).describe();
    const disk = disks.find((d) => d.path === root);

    expect(disk.totalBytes).toBeGreaterThan(0);
    expect(disk.freeBytes).toBeGreaterThan(0);
    expect(disk.usedPercent).toBeGreaterThanOrEqual(0);
    expect(disk.usedPercent).toBeLessThanOrEqual(100);
    expect(disks.some((d) => d.path === path.join(root, 'missing'))).toBe(
      false,
    );
  });

  it('is full at the limit, and never without one', async () => {
    expect(await service(null).isDiskFull()).toBe(false);
    expect(await service(100).isDiskFull()).toBe(false);
    expect(await service(0).isDiskFull()).toBe(true);
  });
});

describe('describeUserTitles', () => {
  let orm: MikroORM;
  let storage: StorageService;
  let userId: string;

  // Movies and series have separate id ranges on TMDB that overlap
  const SERIES = {
    id: 1,
    name: 'Series',
    first_air_date: '2020-01-01',
    last_air_date: '2020-01-08',
    last_episode_to_air: { season_number: 1, episode_number: 2 },
    seasons: [],
  } as TmdbSeriesFull;
  const ANOTHER_SERIES = {
    ...SERIES,
    id: 2,
    name: 'Another',
  } as TmdbSeriesFull;
  const MOVIE = {
    id: 1,
    title: 'Movie',
    release_date: '2020-01-01',
  } as TmdbMovieFull;

  const insert = <T extends object>(entity: T) =>
    orm.em
      .fork()
      .insert(entity)
      .then(() => entity);
  const request = (tmdbId: string, mediaType: MediaTypeFull, episode = 0) => {
    const row = new MediaRequest();
    row.userId = userId;
    row.tmdbId = tmdbId;
    row.mediaType = mediaType;
    row.season = episode ? 1 : 0;
    row.episode = episode;
    return insert(row);
  };
  /** A file indexed on the day, of the episodes of season 1, or of a movie; external unless managed */
  const file = (
    mediaType: MediaType,
    tmdbId: string,
    size: number,
    createdAt: string,
    episodes: [number, number] = [0, 0],
    managed = false,
  ) => {
    const row = new MediaFile();
    row.path = `/tv/${mediaType}-${tmdbId}-${size}.mkv`;
    row.mediaType = mediaType;
    row.tmdbId = tmdbId;
    row.season = episodes[0] ? 1 : 0;
    row.episode = episodes[0];
    row.lastEpisode = episodes[1];
    row.size = size;
    row.modifiedAt = new Date();
    row.createdAt = new Date(createdAt);
    row.managed = managed;
    return insert(row);
  };
  const bind = (
    requestId: string,
    to: Pick<RequestBinding, 'mediaFileId' | 'torrentItemId' | 'pendingBytes'>,
  ) => {
    const row = new RequestBinding();
    row.requestId = requestId;
    Object.assign(row, to);
    return insert(row);
  };
  const titles = (
    options: {
      mediaType?: MediaType;
      status?: TitleUsageStatus;
      letter?: Letter;
      sort?: TitleUsageSort;
      direction?: OrderDirection;
      page?: number;
      itemsPerPage?: number;
    } = {},
  ) =>
    RequestContext.create(orm.em, () =>
      storage.describeUserTitles(userId, {
        mediaType: options.mediaType,
        status: options.status,
        letter: options.letter,
        sort: options.sort ?? TitleUsageSort.Size,
        direction: options.direction,
        pagination: {
          page: options.page ?? 1,
          itemsPerPage: options.itemsPerPage ?? 10,
        },
      }),
    );
  const names = (result: {
    items: { tmdbItem: { name?: string; title?: string } }[];
  }) => result.items.map((item) => item.tmdbItem.name ?? item.tmdbItem.title);

  beforeEach(async () => {
    orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
    await orm.migrator.up();

    const user = new User();
    user.name = 'user';
    user.passwordHash = '';
    userId = (await insert(user)).id;
    await insert(SeriesMetadata.from(SERIES));
    await insert(SeriesMetadata.from(ANOTHER_SERIES));
    await insert(MovieMetadata.from(MOVIE));

    const events = new EventsService();
    const requests = new RequestsService(
      orm.em,
      {} as unknown as MetadataService,
      {} as unknown as IndexersService,
      new JobsService(orm.em, events),
      events,
    );
    storage = new StorageService(
      orm.em,
      requests,
      {} as unknown as UsersService,
      {} as unknown as SettingsService,
      new MetadataService(
        orm.em.getRepository(MovieMetadata),
        orm.em.getRepository(SeriesMetadata),
        orm.em,
        undefined,
      ),
    );

    // The series: two requests hold one file of two episodes, a third waits
    // for a download, and a managed second version of the second episode is
    // held by nobody, so the cleanup deletes it
    const shared = await file(MediaType.Series, '1', 100, '2026-01-01', [1, 2]);
    for (const episode of [1, 2]) {
      const { id } = await request('1', MediaTypeFull.Episode, episode);
      await bind(id, { mediaFileId: shared.id });
    }
    const { id: third } = await request('1', MediaTypeFull.Episode, 3);
    await bind(third, { torrentItemId: 'item', pendingBytes: 50 });
    await file(MediaType.Series, '1', 200, '2026-01-05', [2, 2], true);
    const rule = new RequestRule();
    rule.userId = userId;
    rule.tmdbId = '1';
    rule.keepNext = 2;
    await insert(rule);

    // The other series: a file, and no request of the user
    await file(MediaType.Series, '2', 50, '2026-01-04', [1, 1]);

    // The movie: its file, held by the request
    const { id: movie } = await request('1', MediaTypeFull.Movie);
    await bind(movie, {
      mediaFileId: (await file(MediaType.Movie, '1', 120, '2026-01-02')).id,
    });
  });

  afterEach(() => orm.close());

  it('lists the titles a request of the user has a file of by what they hold, largest first', async () => {
    const result = await titles({ status: TitleUsageStatus.Requested });

    expect(result.total).toBe(2);
    expect(names(result)).toEqual(['Movie', 'Series']);
    expect(result.items[0]).toMatchObject({
      mediaType: MediaType.Movie,
      tmdbId: '1',
      files: 1,
      unretained: 0,
      diskBytes: 120,
      requests: 1,
      fulfilled: 1,
      heldBytes: 120,
    });
    expect(result.items[0].rule).toBeUndefined();
    // The file two requests hold counts once, as the usage of the user does; the version nobody holds is on disk only
    expect(result.items[1]).toMatchObject({
      mediaType: MediaType.Series,
      tmdbId: '1',
      files: 2,
      unretained: 1,
      diskBytes: 300,
      requests: 3,
      fulfilled: 2,
      heldBytes: 100,
      rule: { keepNext: 2, keepWatched: null, keepWatchedHours: null },
    });
  });

  it('lists every title with files by what they take on disk without the status', async () => {
    const result = await titles();

    expect(result.total).toBe(3);
    expect(names(result)).toEqual(['Series', 'Movie', 'Another']);
    expect(result.items[2]).toMatchObject({
      tmdbId: '2',
      files: 1,
      unretained: 0,
      diskBytes: 50,
      requests: 0,
      fulfilled: 0,
      heldBytes: 0,
    });
    expect(result.items[2].rule).toBeUndefined();
  });

  it('sorts by when the newest file was indexed: of those the user holds with the status, of all without', async () => {
    expect(
      names(
        await titles({
          status: TitleUsageStatus.Requested,
          sort: TitleUsageSort.Added,
        }),
      ),
    ).toEqual(['Movie', 'Series']);
    expect(names(await titles({ sort: TitleUsageSort.Added }))).toEqual([
      'Series',
      'Another',
      'Movie',
    ]);
  });

  it('sorts by name, filters by the type of title, and pages', async () => {
    expect(names(await titles({ sort: TitleUsageSort.Name }))).toEqual([
      'Another',
      'Movie',
      'Series',
    ]);

    const movies = await titles({ mediaType: MediaType.Movie });
    expect(movies.total).toBe(1);
    expect(names(movies)).toEqual(['Movie']);

    const page = await titles({ page: 2, itemsPerPage: 2 });
    expect(page).toMatchObject({ total: 3, page: 2, itemsPerPage: 2 });
    expect(page.items.map((item) => item.tmdbId)).toEqual(['2']);
  });

  it('lists the titles under a letter, # for the names that start with none', async () => {
    await insert(
      SeriesMetadata.from({ ...SERIES, id: 3, name: '24' } as TmdbSeriesFull),
    );
    const { id } = await request('3', MediaTypeFull.Episode, 1);
    await bind(id, {
      mediaFileId: (await file(MediaType.Series, '3', 10, '2026-01-03', [1, 1]))
        .id,
    });

    const under = await titles({ letter: 'A' });
    expect(names(under)).toEqual(['Another']);
    expect(under.total).toBe(1);
    expect(
      (await titles({ letter: 'A', status: TitleUsageStatus.Requested })).total,
    ).toBe(0);
    expect(names(await titles({ letter: 'S' }))).toEqual(['Series']);
    expect(names(await titles({ letter: '#' }))).toEqual(['24']);
    expect((await titles({ letter: 'B' })).total).toBe(0);
  });

  it('reads each sort in the other direction when asked', async () => {
    expect(names(await titles({ direction: OrderDirection.Asc }))).toEqual([
      'Another',
      'Movie',
      'Series',
    ]);
    expect(names(await titles({ direction: OrderDirection.Desc }))).toEqual([
      'Series',
      'Movie',
      'Another',
    ]);
    expect(
      names(
        await titles({
          sort: TitleUsageSort.Name,
          direction: OrderDirection.Desc,
        }),
      ),
    ).toEqual(['Series', 'Movie', 'Another']);
    expect(
      names(
        await titles({
          sort: TitleUsageSort.Added,
          direction: OrderDirection.Asc,
        }),
      ),
    ).toEqual(['Movie', 'Another', 'Series']);
  });
});
