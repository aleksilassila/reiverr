import { RequestContext } from '@mikro-orm/core';
import { EntityManager, MikroORM } from '@mikro-orm/sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import {
  MediaType,
  MediaTypeFull,
  OrderDirection,
} from '../common/common.dto.js';
import { IndexersService } from '../indexers/indexers.service.js';
import { JobsService } from '../jobs/jobs.service.js';
import { MovieMetadata, SeriesMetadata } from '../metadata/metadata.entity.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { TmdbMovieFull, TmdbSeriesFull } from '../metadata/tmdb/tmdb.dto.js';
import mikroOrmConfig from '../mikro-orm.config.js';
import { RequestRule } from '../requests/request-rule.entity.js';
import { MediaRequest } from '../requests/request.entity.js';
import { RequestsService } from '../requests/requests.service.js';
import { User } from '../users/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { CleanupSchedule, TitleUsageSort } from './library.dto.js';
import { LibraryService } from './library.service.js';
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
        getSettings: async () => ({
          movieFolders: [path.join(root, 'missing')],
          seriesFolders: [root],
          cleanup: CleanupSchedule.Daily,
          maxDiskUsagePercent,
        }),
      } as unknown as LibraryService,
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
  const file = (mediaType: MediaType, tmdbId: string, size: number) => {
    const row = new MediaFile();
    row.path = `/tv/${mediaType}-${tmdbId}-${size}.mkv`;
    row.mediaType = mediaType;
    row.tmdbId = tmdbId;
    row.size = size;
    row.modifiedAt = new Date();
    return insert(row);
  };
  const bind = (
    requestId: string,
    to: Pick<
      RequestBinding,
      'mediaFileId' | 'torrentItemId' | 'pendingBytes' | 'updatedAt'
    >,
  ) => {
    const row = new RequestBinding();
    row.requestId = requestId;
    Object.assign(row, to);
    return insert(row);
  };
  const titles = (
    options: {
      mediaType?: MediaType;
      sort?: TitleUsageSort;
      direction?: OrderDirection;
      page?: number;
      itemsPerPage?: number;
    } = {},
  ) =>
    RequestContext.create(orm.em, () =>
      storage.describeUserTitles(userId, {
        mediaType: options.mediaType,
        sort: options.sort ?? TitleUsageSort.Size,
        direction: options.direction,
        pagination: {
          page: options.page ?? 1,
          itemsPerPage: options.itemsPerPage ?? 10,
        },
      }),
    );

  beforeEach(async () => {
    orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
    await orm.migrator.up();

    const user = new User();
    user.name = 'user';
    user.password = '';
    userId = (await insert(user)).id;
    await insert(SeriesMetadata.from(SERIES));
    await insert(SeriesMetadata.from(ANOTHER_SERIES));
    await insert(MovieMetadata.from(MOVIE));

    const requests = new RequestsService(
      orm.em,
      {} as unknown as MetadataService,
      {} as unknown as IndexersService,
      new JobsService(orm.em),
    );
    storage = new StorageService(
      orm.em,
      requests,
      {} as unknown as UsersService,
      {} as unknown as LibraryService,
      new MetadataService(
        orm.em.getRepository(MovieMetadata),
        orm.em.getRepository(SeriesMetadata),
        orm.em,
        undefined,
      ),
    );

    // The series: two requests hold one file, one waits for a download
    const shared = await file(MediaType.Series, '1', 100);
    for (const [episode, day] of [
      [1, 1],
      [2, 3],
    ]) {
      const { id } = await request('1', MediaTypeFull.Episode, episode);
      await bind(id, {
        mediaFileId: shared.id,
        updatedAt: new Date(`2026-01-0${day}T00:00:00Z`),
      });
    }
    const { id: third } = await request('1', MediaTypeFull.Episode, 3);
    await bind(third, { torrentItemId: 'item', pendingBytes: 50 });
    const rule = new RequestRule();
    rule.userId = userId;
    rule.tmdbId = '1';
    rule.keepNext = 2;
    await insert(rule);

    // The other series: a request bound to nothing
    await request('2', MediaTypeFull.Episode, 1);

    // The movie: its file
    const { id: movie } = await request('1', MediaTypeFull.Movie);
    await bind(movie, {
      mediaFileId: (await file(MediaType.Movie, '1', 120)).id,
      updatedAt: new Date('2026-01-02T00:00:00Z'),
    });
  });

  it('sorts by when a request of the title last got its file, titles without one last', async () => {
    const { items } = await titles({ sort: TitleUsageSort.Fulfilled });

    expect(
      items.map((item) => [
        item.tmdbItem.name ?? item.tmdbItem.title,
        item.lastFulfilledAt,
      ]),
    ).toEqual([
      ['Series', '2026-01-03T00:00:00.000Z'],
      ['Movie', '2026-01-02T00:00:00.000Z'],
      ['Another', undefined],
    ]);
  });

  afterEach(() => orm.close());

  it('counts what the requests of each title take, as the usage of the user does, largest first', async () => {
    const { items, total } = await titles();

    expect(total).toBe(3);
    expect(
      items.map((item) => item.tmdbItem.name ?? item.tmdbItem.title),
    ).toEqual(['Series', 'Movie', 'Another']);
    expect(items[0]).toMatchObject({
      mediaType: MediaType.Series,
      tmdbId: '1',
      requests: 3,
      withFile: 2,
      downloading: 1,
      heldBytes: 100,
      pendingBytes: 50,
      rule: { keepNext: 2, keepWatched: null, keepWatchedHours: null },
    });
    expect(items[1]).toMatchObject({
      mediaType: MediaType.Movie,
      requests: 1,
      withFile: 1,
      heldBytes: 120,
      pendingBytes: 0,
    });
    expect(items[1].rule).toBeUndefined();
    expect(items[2]).toMatchObject({ tmdbId: '2', requests: 1, heldBytes: 0 });
    expect(items[2].rule).toBeUndefined();
  });

  it('sorts by name, filters by the type of title, and pages', async () => {
    const byName = await titles({ sort: TitleUsageSort.Name });
    expect(
      byName.items.map((item) => item.tmdbItem.name ?? item.tmdbItem.title),
    ).toEqual(['Another', 'Movie', 'Series']);

    const movies = await titles({ mediaType: MediaType.Movie });
    expect(movies.total).toBe(1);
    expect(movies.items.map((item) => item.tmdbItem.title)).toEqual(['Movie']);

    const page = await titles({ page: 2, itemsPerPage: 2 });
    expect(page).toMatchObject({ total: 3, page: 2, itemsPerPage: 2 });
    expect(page.items.map((item) => item.tmdbId)).toEqual(['2']);
  });

  it('reads each sort in the other direction when asked, titles without a file still last', async () => {
    const names = ({
      items,
    }: {
      items: { tmdbItem: { name?: string; title?: string } }[];
    }) => items.map((item) => item.tmdbItem.name ?? item.tmdbItem.title);

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
          sort: TitleUsageSort.Fulfilled,
          direction: OrderDirection.Asc,
        }),
      ),
    ).toEqual(['Movie', 'Series', 'Another']);
  });
});
