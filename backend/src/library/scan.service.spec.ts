import { MikroORM } from '@mikro-orm/sqlite';
import { ServiceUnavailableException } from '@nestjs/common';
import {
  chmodSync,
  mkdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import * as path from 'node:path';
import {
  createLibraryFixture,
  LibraryFixture,
  TMDB_ID,
} from '../../test/library-fixture.js';
import { MediaType } from '../common/common.dto.js';
import { Job } from '../jobs/job.entity.js';
import { JobsService } from '../jobs/jobs.service.js';
import { TmdbService } from '../metadata/tmdb/tmdb.service.js';
import mikroOrmConfig from '../mikro-orm.config.js';
import { LogEntry } from '../server-log/log-entry.entity.js';
import { ServerLogService } from '../server-log/server-log.service.js';
import { LibraryService } from './library.service.js';
import { MediaFile } from './media-file.entity.js';
import { ScanService } from './scan.service.js';

describe('ScanService', () => {
  describe('the nightly scan', () => {
    let orm: MikroORM;

    beforeEach(async () => {
      orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
      await orm.migrator.up();
    });

    afterEach(() => orm.close());

    it('queues a scan of every library folder, once until it runs', async () => {
      const library = {
        getSettings: async () => ({
          movieFolders: { '/movies': { primary: true } },
          seriesFolders: {
            '/tv': { primary: true },
            '/anime': { primary: false },
          },
        }),
      };
      const scan = new ScanService(
        orm.em,
        library as unknown as LibraryService,
        {} as TmdbService,
        new JobsService(orm.em),
        {} as ServerLogService,
      );
      const queued = async () =>
        (
          await orm.em.fork().find(Job, {}, { orderBy: { dedupeKey: 'asc' } })
        ).map((job) => [job.type, job.payload]);

      await scan.scanNightly();
      // The scans that have not run yet are not queued twice
      await scan.scanNightly();

      expect(await queued()).toEqual([
        ['library.scanFolder', { folder: '/anime' }],
        ['library.scanFolder', { folder: '/movies' }],
        ['library.scanFolder', { folder: '/tv' }],
      ]);
    });
  });

  describe('with a library', () => {
    let fixture: LibraryFixture;
    let orm: MikroORM;
    let scan: ScanService;
    let root: string;
    let folder: string;
    let jobs: LibraryFixture['jobs'];
    let tmdb: LibraryFixture['tmdb'];
    let request: LibraryFixture['request'];
    let write: LibraryFixture['write'];
    let indexed: LibraryFixture['indexed'];
    let importEpisode: LibraryFixture['importEpisode'];
    let scanSeries: LibraryFixture['scanSeries'];
    let bind: LibraryFixture['bind'];
    let reconciled: LibraryFixture['reconciled'];

    beforeEach(async () => {
      fixture = await createLibraryFixture();
      ({
        orm,
        scan,
        root,
        library: folder,
        jobs,
        tmdb,
        request,
        write,
        indexed,
        importEpisode,
        scanSeries,
        bind,
        reconciled,
      } = fixture);
    });

    afterEach(() => fixture.close());

    describe('scanning a title', () => {
      it('indexes the files it finds as unmanaged files and keeps their ids', async () => {
        write('tv/Test Show (2020)/Season 1/Test Show - S01E01.mkv');
        write('tv/Test Show (2020)/Season 1/Test Show - S01E02-E03.mkv');
        write('tv/Test Show (2020)/Season 1/notes.txt');
        write('tv/Another Show (2020)/Season 1/Another Show - S01E01.mkv');

        const files = await scanSeries();

        expect(files.map((file) => [file.fileName, file.episodes])).toEqual([
          ['Test Show - S01E01.mkv', [1]],
          ['Test Show - S01E02-E03.mkv', [2, 3]],
        ]);
        expect(await indexed()).toMatchObject([
          { id: files[0].id, tmdbId: TMDB_ID, season: 1, episode: 1, size: 5 },
          { id: files[1].id, episode: 2, lastEpisode: 3 },
        ]);
        expect((await indexed()).map((f) => [f.managed, f.infoHash])).toEqual([
          [false, null],
          [false, null],
        ]);

        // A changed file is the same file, a deleted file is forgotten
        write('tv/Test Show (2020)/Season 1/Test Show - S01E01.mkv', 'longer');
        rmSync(
          path.join(
            folder,
            'Test Show (2020)/Season 1/Test Show - S01E02-E03.mkv',
          ),
        );

        expect(await scanSeries()).toMatchObject([
          { id: files[0].id, size: 6 },
        ]);
        expect(await indexed()).toMatchObject([{ id: files[0].id, size: 6 }]);
      });

      it('forgets an indexed file only when it is gone or outside the title folders', async () => {
        // A name that the walk passes over, like a file that is imported while it runs
        const kept = write('tv/Test Show (2020)/Season 1/importing.mkv');
        const otherFolder = write('tv/Other Folder/Test Show - S01E04.mkv');
        const outside = write('elsewhere/Test Show - S01E06.mkv');
        const gone = path.join(folder, 'Test Show (2020)/Season 1/S01E07.mkv');
        await orm.em.fork().insert(
          MediaFile,
          [kept, otherFolder, outside, gone].map((filePath, i) => ({
            id: `file-${i}`,
            path: filePath,
            mediaType: MediaType.Series,
            tmdbId: TMDB_ID,
            season: 1,
            episode: 5 + i,
            lastEpisode: 5 + i,
            size: 5,
            modifiedAt: new Date(),
            managed: false,
            createdAt: new Date(),
          })),
        );
        write('tv/Test Show (2020)/Season 1/Test Show - S01E01.mkv');

        await scanSeries();

        expect((await indexed()).map((file) => file.path)).toEqual([
          path.join(folder, 'Test Show (2020)/Season 1/Test Show - S01E01.mkv'),
          path.join(folder, 'Test Show (2020)/Season 1/importing.mkv'),
        ]);
      });

      it('leaves a managed file as it was imported', async () => {
        // A folder without an id tag, which a lookup of another title matches too
        write('tv/Test Show (2020)/Season 1/notes.txt');
        const imported = await importEpisode(
          write('downloads/S01E01.mkv'),
          [1],
        );
        const [before] = await indexed();
        writeFileSync(imported, 'changed in place');

        await scanSeries();
        // A lookup of another title that matches the same folder
        await scanSeries('200');

        expect(await indexed()).toMatchObject([
          {
            id: before.id,
            tmdbId: TMDB_ID,
            size: before.size,
            modifiedAt: before.modifiedAt,
            managed: true,
          },
        ]);
      });
    });

    describe('scanning a library folder', () => {
      const scanFolder = (options?: { evenIfUnavailable?: boolean }) =>
        request(() => scan.scanFolder(folder, options));
      const preview = () => request(() => scan.previewScan(folder));
      const rows = async () =>
        (await indexed()).map((file) => [
          path.relative(folder, file.path),
          file.tmdbId,
          file.season,
          file.episode,
        ]);

      it('indexes the folders it can tell the title of and forgets what is gone', async () => {
        write(
          'tv/Test Show (2020) [tmdbid-100]/Season 1/Test Show - S01E01.mkv',
        );
        const another = write(
          'tv/Another Show (2021)/Season 1/Another Show - S01E02.mkv',
        );
        write('tv/Third {tvdb-456}/Season 2/Third - S02E03.mkv');
        write('tv/Unknown (1999)/Season 1/Unknown - S01E01.mkv');
        write('tv/Not an episode/clip.mkv');
        write('tv/Extras/readme.txt');
        tmdb.searchTitles.mockImplementation(async (_type, query: string) =>
          query === 'Another Show'
            ? [
                { tmdbId: '199', titles: ['Another Show'], date: '1999-01-01' },
                { tmdbId: '200', titles: ['Another Show'], date: '2021-05-01' },
              ]
            : [],
        );
        tmdb.findByExternalId.mockResolvedValue({
          tmdbId: '300',
          titles: ['Third'],
          date: '2019-01-01',
        });

        expect(await scanFolder()).toEqual({
          added: 3,
          updated: 0,
          forgotten: 0,
          unresolved: ['Unknown (1999)'],
          failed: [],
        });
        expect(await rows()).toEqual([
          [
            'Another Show (2021)/Season 1/Another Show - S01E02.mkv',
            '200',
            1,
            2,
          ],
          [
            'Test Show (2020) [tmdbid-100]/Season 1/Test Show - S01E01.mkv',
            '100',
            1,
            1,
          ],
          ['Third {tvdb-456}/Season 2/Third - S02E03.mkv', '300', 2, 3],
        ]);
        expect((await indexed()).every((file) => !file.managed)).toBe(true);
        expect(tmdb.searchTitles.mock.calls).toEqual([
          [MediaType.Series, 'Another Show', 2021],
          [MediaType.Series, 'Unknown', 1999],
        ]);
        expect(tmdb.findByExternalId.mock.calls).toEqual([
          [MediaType.Series, 'tvdb_id', '456'],
        ]);

        // A folder with indexed files is known, only the unresolved one is asked about again
        tmdb.searchTitles.mockClear();
        tmdb.findByExternalId.mockClear();
        expect(await scanFolder()).toMatchObject({
          added: 0,
          updated: 0,
          forgotten: 0,
        });
        expect(tmdb.searchTitles.mock.calls).toEqual([
          [MediaType.Series, 'Unknown', 1999],
        ]);
        expect(tmdb.findByExternalId).not.toHaveBeenCalled();
        expect(reconciled()).toEqual([]);

        // A changed file is updated, a deleted one forgotten, and the
        // request that had it is looked at again
        write('tv/Third {tvdb-456}/Season 2/Third - S02E03.mkv', 'longer');
        await bind(
          'request-a',
          (await indexed()).find((file) => file.path === another).id,
        );
        rmSync(another);
        expect(await scanFolder()).toMatchObject({
          added: 0,
          updated: 1,
          forgotten: 1,
        });
        expect(reconciled()).toEqual(['request-a']);
        expect(await preview()).toMatchObject({ available: true, missing: [] });
      });

      it('leaves a managed file as it was imported', async () => {
        const imported = await importEpisode(
          write('downloads/S01E01.mkv'),
          [1],
        );
        const [before] = await indexed();
        writeFileSync(imported, 'changed in place');

        expect(await scanFolder()).toMatchObject({
          added: 0,
          updated: 0,
          forgotten: 0,
        });
        expect(await indexed()).toEqual([before]);
      });

      it('reports a directory it cannot read and keeps what is indexed in it', async () => {
        const locked = write(
          'tv/Test Show (2020) [tmdbid-100]/Season 1/Test Show - S01E01.mkv',
        );
        write(
          'tv/Test Show (2020) [tmdbid-100]/Season 2/Test Show - S02E01.mkv',
        );
        await scanFolder();
        chmodSync(path.dirname(locked), 0o000);

        try {
          expect(await scanFolder()).toEqual({
            added: 0,
            updated: 0,
            forgotten: 0,
            unresolved: [],
            failed: [
              {
                path: 'Test Show (2020) [tmdbid-100]/Season 1',
                error: 'EACCES: permission denied',
              },
            ],
          });
          expect(await indexed()).toHaveLength(2);
        } finally {
          chmodSync(path.dirname(locked), 0o755);
        }
      });

      it('refuses a folder that is not available unless forced, which forgets everything in it', async () => {
        write(
          'tv/Test Show (2020) [tmdbid-100]/Season 1/Test Show - S01E02.mkv',
        );
        await importEpisode(write('downloads/S01E01.mkv'), [1]);
        await scanFolder();

        // Only one file is missing while the folder is there
        rmSync(
          path.join(
            folder,
            'Test Show (2020) [tmdbid-100]/Season 1/Test Show - S01E02.mkv',
          ),
        );
        expect(await preview()).toMatchObject({
          available: true,
          missing: [{ episode: 2 }],
        });

        renameSync(folder, path.join(root, 'disk'));
        mkdirSync(folder);

        await expect(scanFolder()).rejects.toThrow(ServiceUnavailableException);
        expect(await preview()).toMatchObject({
          available: false,
          reason: `Library folder "${folder}" is not available: it is empty, but files are indexed in it`,
          missing: [{ episode: 1 }, { episode: 2 }],
        });
        expect(await indexed()).toHaveLength(2);
        expect(reconciled()).toEqual([]);
        await bind('request-b', (await indexed())[0].id);

        expect(await scanFolder({ evenIfUnavailable: true })).toEqual({
          added: 0,
          updated: 0,
          forgotten: 2,
          unresolved: [],
          failed: [],
        });
        expect(await indexed()).toEqual([]);
        // Their requests download them again
        expect(reconciled()).toEqual(['request-b']);
        expect(await preview()).toMatchObject({ available: true, missing: [] });
      });

      it('scans at night, and logs a folder that is not available instead', async () => {
        write(
          'tv/Test Show (2020) [tmdbid-100]/Season 1/Test Show - S01E01.mkv',
        );
        jobs.define.mockClear();
        scan.onModuleInit();
        const [, job] = jobs.define.mock.calls.find(
          ([type]) => type === 'library.scanFolder',
        );
        const runJob = (target = folder) =>
          request(() => job.run({ folder: target }, undefined));
        const logged = () => orm.em.fork().find(LogEntry, {});

        await runJob();
        expect(await indexed()).toHaveLength(1);

        renameSync(folder, path.join(root, 'disk'));
        mkdirSync(folder);
        await runJob();

        expect(await indexed()).toHaveLength(1);
        expect(await logged()).toMatchObject([
          {
            type: 'scan.failed',
            message: `Did not scan "${folder}": Library folder "${folder}" is not available: it is empty, but files are indexed in it`,
            data: { folder: folder },
          },
        ]);

        // A folder that left the library since the job was queued is not scanned
        await runJob(path.join(root, 'elsewhere'));
        expect(await logged()).toHaveLength(1);
      });
    });
  });
});
