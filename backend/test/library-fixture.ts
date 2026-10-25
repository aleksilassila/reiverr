import { RequestContext } from '@mikro-orm/core';
import { EntityManager, MikroORM } from '@mikro-orm/sqlite';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { vi } from 'vitest';
import { MediaType } from '../src/common/common.dto.js';
import { JobsService } from '../src/jobs/jobs.service.js';
import { DeletionService } from '../src/library/deletion.service.js';
import { ImportService } from '../src/library/import.service.js';
import { CleanupSchedule } from '../src/library/library.dto.js';
import { LibraryService } from '../src/library/library.service.js';
import { MediaFile } from '../src/library/media-file.entity.js';
import { PlaybackService } from '../src/library/playback.service.js';
import { RequestBinding } from '../src/library/request-binding.entity.js';
import { ScanService } from '../src/library/scan.service.js';
import { MetadataService } from '../src/metadata/metadata.service.js';
import { TmdbService } from '../src/metadata/tmdb/tmdb.service.js';
import mikroOrmConfig from '../src/mikro-orm.config.js';
import { RequestsService } from '../src/requests/requests.service.js';
import { ServerLogService } from '../src/server-log/server-log.service.js';
import { SettingsService } from '../src/settings/settings.service.js';

export const TMDB_ID = '100';
export const INFO_HASH = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678';

export type LibraryFixture = Awaited<ReturnType<typeof createLibraryFixture>>;

/**
 * The library services on an in-memory database with a temporary library
 * folder, and their neighbours as mocks
 */
export async function createLibraryFixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'reiverr-library-'));
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
    deleteRequests: vi.fn(async (_em: EntityManager, _ids: string[]) => 0),
  };

  const settings = new SettingsService(orm.em);
  const serverLog = new ServerLogService(orm.em, settings);
  const libraryService = new LibraryService(
    orm.em,
    settings,
    metadata as unknown as MetadataService,
    jobs as unknown as JobsService,
  );
  const scan = new ScanService(
    orm.em,
    libraryService,
    tmdb as unknown as TmdbService,
    jobs as unknown as JobsService,
    serverLog,
  );
  const playback = new PlaybackService(libraryService, scan);
  const importService = new ImportService(orm.em, libraryService);
  const deletion = new DeletionService(
    orm.em,
    jobs as unknown as JobsService,
    libraryService,
    requests as unknown as RequestsService,
    serverLog,
  );

  // Every call gets its own entity manager, as every HTTP request does
  const request = <T>(run: () => Promise<T>) =>
    RequestContext.create(orm.em, run);

  await request(() =>
    libraryService.updateSettings({
      movieFolders: {},
      seriesFolders: { [library]: { primary: true } },
      cleanup: CleanupSchedule.Daily,
      maxDiskUsagePercent: null,
    }),
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
  const importEpisode = async (
    sourcePath: string,
    episodes: number[],
    subtitles: string[] = [],
  ) => {
    const file = await request(() =>
      importService.importFile({
        sourcePath,
        infoHash: INFO_HASH,
        mediaType: MediaType.Series,
        tmdbId: TMDB_ID,
        season: 1,
        episodes,
        subtitles: subtitles.map((subtitlePath) => ({
          sourcePath: subtitlePath,
          name: path.basename(subtitlePath),
        })),
      }),
    );

    return file.path;
  };

  /** A scan of the series, which the job does, and what is on disk then */
  const scanSeries = async (tmdbId = TMDB_ID) => {
    await request(() => scan.scanTitle(MediaType.Series, tmdbId));

    return request(() => playback.listSeriesFiles(tmdbId));
  };

  /** Library folders that changed without the service, which forgets nothing; the first is primary */
  const saveFoldersAround = (seriesFolders: string[]) =>
    request(() =>
      settings.saveValue('library', {
        movieFolders: {},
        seriesFolders: Object.fromEntries(
          seriesFolders.map((folder, index) => [
            folder,
            { primary: index === 0 },
          ]),
        ),
      }),
    );

  /** A request that has a file, as the fulfilment binds it */
  const bind = (requestId: string, mediaFileId: string) =>
    orm.em.fork().insert(RequestBinding, {
      requestId,
      mediaFileId,
      updatedAt: new Date(),
    });

  /** The requests whose reconcile was queued */
  const reconciled = () =>
    jobs.enqueue.mock.calls
      .filter((call) => call[1] === 'library.reconcileRequest')
      .map((call) => (call[2] as { requestId: string }).requestId);

  const close = async () => {
    await orm.close();
    rmSync(root, { recursive: true });
  };

  return {
    orm,
    root,
    library,
    libraryService,
    scan,
    playback,
    importService,
    deletion,
    jobs,
    tmdb,
    requests,
    request,
    write,
    indexed,
    importEpisode,
    scanSeries,
    saveFoldersAround,
    bind,
    reconciled,
    close,
  };
}
