import { RequestContext } from '@mikro-orm/core';
import { EntityManager, MikroORM } from '@mikro-orm/sqlite';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { vi } from 'vitest';
import { MediaType } from '../src/common/common.dto.js';
import { DownloadsService } from '../src/downloads/downloads.service.js';
import { JobsService } from '../src/jobs/jobs.service.js';
import { CleanupService } from '../src/local-media/cleanup.service.js';
import { ImportService } from '../src/local-media/import.service.js';
import { LocalMediaService } from '../src/local-media/local-media.service.js';
import { MediaFile } from '../src/local-media/media-file.entity.js';
import { MetadataService } from '../src/metadata/metadata.service.js';
import { TmdbService } from '../src/metadata/tmdb/tmdb.service.js';
import mikroOrmConfig from '../src/mikro-orm.config.js';
import { MediaRequest } from '../src/requests/request.entity.js';
import { RequestsService } from '../src/requests/requests.service.js';
import { ServerLogService } from '../src/server-log/server-log.service.js';
import { SettingsService } from '../src/settings/settings.service.js';

export const TMDB_ID = '100';
export const INFO_HASH = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678';

export type LibraryFixture = Awaited<ReturnType<typeof createLibraryFixture>>;

/**
 * The local media services on an in-memory database with a temporary
 * library folder, and their neighbours as mocks
 */
export async function createLibraryFixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'reiverr-local-media-'));
  const library = path.join(root, 'tv');
  mkdirSync(library);

  const orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
  await orm.migrator.up();

  const jobs = {
    runNow: async () => {},
    enqueue: vi.fn(
      async (
        _em: EntityManager,
        _type: string,
        _payload: unknown,
        _options?: unknown,
      ) => {},
    ),
    define: vi.fn(),
  };
  const tmdb = {
    searchTitles: vi.fn().mockResolvedValue([]),
    findByExternalId: vi.fn().mockResolvedValue(undefined),
  };
  const metadata = {
    getSeriesByTmdbId: async () => ({
      tmdbSeries: { name: 'Test Show', first_air_date: '2020-01-01' },
    }),
  };
  const requests = {
    findReferringRequests: vi.fn(
      async (
        _ids: string[],
      ): Promise<Pick<MediaRequest, 'id' | 'mediaFileId'>[]> => [],
    ),
    deleteRequests: vi.fn(
      async (
        _em: EntityManager,
        _where: { ids?: string[]; mediaFileIds?: string[] },
      ) => 0,
    ),
  };

  const settings = new SettingsService(orm.em);
  const serverLog = new ServerLogService(orm.em, settings);
  const localMedia = new LocalMediaService(
    orm.em,
    settings,
    metadata as unknown as MetadataService,
    tmdb as unknown as TmdbService,
    jobs as unknown as JobsService,
    serverLog,
  );
  const importService = new ImportService(
    orm.em,
    jobs as unknown as JobsService,
    localMedia,
    {} as DownloadsService,
  );
  const cleanup = new CleanupService(
    orm.em,
    jobs as unknown as JobsService,
    localMedia,
    {} as DownloadsService,
    requests as unknown as RequestsService,
    serverLog,
  );

  // Every call gets its own entity manager, as every HTTP request does
  const request = <T>(run: () => Promise<T>) =>
    RequestContext.create(orm.em, run);

  await request(() =>
    localMedia.updateSettings({ movieFolders: [], seriesFolders: [library] }),
  );

  const write = (file: string, content = 'video') => {
    const filePath = path.join(root, file);
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, content);

    return filePath;
  };

  const indexed = () =>
    orm.em.fork().find(MediaFile, {}, { orderBy: { path: 'asc' } });

  /** Imports a file as a version of the test torrent, as the import job does */
  const importEpisode = async (sourcePath: string, episodes: number[]) => {
    const placed = await request(() =>
      importService.placeEpisodeFile({
        tmdbId: TMDB_ID,
        season: 1,
        episodes,
        sourcePath,
        infoHash: INFO_HASH,
      }),
    );
    await request(() =>
      orm.em.transactional((tx) => importService.indexImportedFile(tx, placed)),
    );

    return placed.path;
  };

  /** A scan of the series, which the job does, and what is on disk then */
  const scanSeries = async (tmdbId = TMDB_ID) => {
    await request(() => localMedia.scanTitle(MediaType.Series, tmdbId));

    return request(() => localMedia.listSeriesFiles(tmdbId));
  };

  /** Library folders that changed without the service, which forgets nothing */
  const saveFoldersAround = (seriesFolders: string[]) =>
    request(() =>
      settings.saveValue('local-media', { movieFolders: [], seriesFolders }),
    );

  /** The titles whose reconciliation was queued */
  const reconciled = () =>
    jobs.enqueue.mock.calls
      .filter((call) => call[1] === 'downloads.reconcileTitle')
      .map((call) => call[2]);

  const close = async () => {
    await orm.close();
    rmSync(root, { recursive: true });
  };

  return {
    orm,
    root,
    library,
    localMedia,
    importService,
    cleanup,
    jobs,
    tmdb,
    requests,
    request,
    write,
    indexed,
    importEpisode,
    scanSeries,
    saveFoldersAround,
    reconciled,
    close,
  };
}
