import { MikroORM } from '@mikro-orm/sqlite';
import { BadRequestException } from '@nestjs/common';
import {
  chmodSync,
  existsSync,
  readdirSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { promises as fsPromises } from 'node:fs';
import * as path from 'node:path';
import {
  createLibraryFixture,
  INFO_HASH,
  LibraryFixture,
  TMDB_ID,
} from '../../test/library-fixture.js';
import { MediaType } from '../common/common.dto.js';
import { Job } from '../jobs/job.entity.js';
import { JobsService } from '../jobs/jobs.service.js';
import mikroOrmConfig from '../mikro-orm.config.js';
import { RequestsService } from '../requests/requests.service.js';
import { LogEntry } from '../server-log/log-entry.entity.js';
import { ServerLogService } from '../server-log/server-log.service.js';
import { DeletionService } from './deletion.service.js';
import { CleanupSchedule } from './library.dto.js';
import { LibraryService } from './library.service.js';
import { MediaFile } from './media-file.entity.js';

describe('DeletionService', () => {
  describe('the cleanup hour', () => {
    let orm: MikroORM;
    let deletionService: DeletionService;
    let cleanup: CleanupSchedule;

    const queued = async () =>
      (
        await orm.em.fork().find(Job, {}, { orderBy: { dedupeKey: 'asc' } })
      ).map((job) => [job.type, job.payload]);

    beforeEach(async () => {
      orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
      await orm.migrator.up();

      const library = {
        getSettings: async () => ({ cleanup }),
        findTitlesWithManagedFiles: async () => ['1', '2'],
      };
      deletionService = new DeletionService(
        orm.em,
        new JobsService(orm.em),
        library as unknown as LibraryService,
        {} as RequestsService,
        {} as ServerLogService,
      );
    });

    afterEach(() => orm.close());

    it('queues the cleanup on cleanup days', async () => {
      cleanup = CleanupSchedule.Off;
      await deletionService.onCleanupHour();
      expect(await queued()).toEqual([]);

      cleanup = CleanupSchedule.Daily;
      await deletionService.onCleanupHour();
      // A cleanup that has not run yet is not queued twice
      await deletionService.onCleanupHour();

      expect(await queued()).toEqual([
        ['library.cleanUpTitle', { mediaType: MediaType.Series, tmdbId: '1' }],
        ['library.cleanUpTitle', { mediaType: MediaType.Series, tmdbId: '2' }],
      ]);
    });
  });

  describe('with a library', () => {
    let fixture: LibraryFixture;
    let orm: MikroORM;
    let deletion: DeletionService;
    let root: string;
    let folder: string;
    let jobs: LibraryFixture['jobs'];
    let requests: LibraryFixture['requests'];
    let request: LibraryFixture['request'];
    let write: LibraryFixture['write'];
    let indexed: LibraryFixture['indexed'];
    let importEpisode: LibraryFixture['importEpisode'];
    let scanSeries: LibraryFixture['scanSeries'];
    let saveFoldersAround: LibraryFixture['saveFoldersAround'];
    let bind: LibraryFixture['bind'];

    const logged = async () =>
      (await orm.em.fork().find(LogEntry, {})).map((entry) => entry.message);
    const idOf = async (filePath: string) =>
      (await indexed()).find((file) => file.path === filePath).id;

    beforeEach(async () => {
      fixture = await createLibraryFixture();
      ({
        orm,
        deletion,
        root,
        library: folder,
        jobs,
        requests,
        request,
        write,
        indexed,
        importEpisode,
        scanSeries,
        saveFoldersAround,
        bind,
      } = fixture);
    });

    afterEach(() => fixture.close());

    describe('deleting a managed file', () => {
      const deleteFile = (id: string) =>
        request(() => deletion.deleteManagedFile(id, 'a test'));

      it('deletes the file with the folders it leaves empty', async () => {
        const first = await importEpisode(write('downloads/S01E01.mkv'), [1]);
        const second = await importEpisode(write('downloads/S01E02.mkv'), [2]);
        const seasonFolder = path.dirname(first);

        await deleteFile(await idOf(first));
        expect(readdirSync(seasonFolder)).toEqual([path.basename(second)]);
        expect((await indexed()).map((file) => file.path)).toEqual([second]);
        expect(await orm.em.fork().find(LogEntry, {})).toMatchObject([
          {
            type: 'file.deleted',
            message: `Deleted "${first}": a test`,
            data: {
              path: first,
              size: 5,
              mediaType: 'series',
              tmdbId: TMDB_ID,
              season: 1,
              episode: 1,
              lastEpisode: 1,
              infoHash: INFO_HASH,
            },
          },
        ]);

        await deleteFile(await idOf(second));
        expect(await indexed()).toEqual([]);
        expect(readdirSync(folder)).toEqual([]);
        // The download is another link to the data and stays
        expect(existsSync(path.join(root, 'downloads/S01E02.mkv'))).toBe(true);
      });

      it('leaves a folder that has something else in it', async () => {
        const imported = await importEpisode(
          write('downloads/S01E01.mkv'),
          [1],
        );
        const seasonFolder = path.dirname(imported);
        writeFileSync(path.join(seasonFolder, 'notes.txt'), 'notes');

        await deleteFile(await idOf(imported));

        expect(readdirSync(seasonFolder)).toEqual(['notes.txt']);
      });

      it('keeps a file that is not as it was imported and stops managing it', async () => {
        const imported = await importEpisode(
          write('downloads/S01E01.mkv'),
          [1],
        );
        const id = await idOf(imported);
        rmSync(imported);
        writeFileSync(imported, 'something else');

        await deleteFile(id);

        expect(existsSync(imported)).toBe(true);
        expect(await indexed()).toMatchObject([{ id, managed: false }]);
        await expect(deleteFile(id)).rejects.toThrow('is not managed');
        expect(await logged()).toEqual([]);
      });

      it('keeps a file that was replaced by one of the same size and stops managing it', async () => {
        const imported = await importEpisode(
          write('downloads/S01E01.mkv'),
          [1],
        );
        const id = await idOf(imported);
        rmSync(imported);
        writeFileSync(imported, 'other');
        const later = new Date(Date.now() + 60_000);
        utimesSync(imported, later, later);
        // A lookup in between does not make the new file look imported
        await scanSeries();

        await deleteFile(id);

        expect(existsSync(imported)).toBe(true);
        expect(await indexed()).toMatchObject([{ id, managed: false }]);
      });

      it('keeps a file that the library folders no longer contain', async () => {
        const imported = await importEpisode(
          write('downloads/S01E01.mkv'),
          [1],
        );
        const id = await idOf(imported);
        await saveFoldersAround([path.join(root, 'downloads')]);

        await deleteFile(id);

        expect(existsSync(imported)).toBe(true);
        expect(await indexed()).toMatchObject([{ id, managed: false }]);
      });

      it('keeps a file that a request holds', async () => {
        const imported = await importEpisode(
          write('downloads/S01E01.mkv'),
          [1],
        );
        const id = await idOf(imported);
        await bind('request-1', id);

        expect(await deleteFile(id)).toBe('kept');

        expect(existsSync(imported)).toBe(true);
        expect(await indexed()).toMatchObject([{ id, managed: true }]);
        expect(await logged()).toEqual([]);
      });

      it('forgets a file that is already gone', async () => {
        const imported = await importEpisode(
          write('downloads/S01E01.mkv'),
          [1],
        );
        const id = await idOf(imported);
        rmSync(imported);

        expect(await deleteFile(id)).toBe('deleted');

        expect(await indexed()).toEqual([]);
        expect(await logged()).toEqual([
          `Deleted "${imported}": a test, it was gone already`,
        ]);
      });
    });

    describe('deleting the entries of a library folder', () => {
      const SHOW = 'Test Show (2020) [tmdbid-100]';
      const deleteEntries = (paths: string[], target = folder) =>
        request(() => deletion.deleteLibraryEntries(target, paths, 'a test'));

      it('deletes what it can and reports what it cannot', async () => {
        const kept = write(`tv/${SHOW}/Season 1/Test Show - S01E01.mkv`);
        write('tv/Unknown/notes.txt');
        await scanSeries();
        const locked = path.dirname(kept);
        chmodSync(locked, 0o555);

        try {
          expect(
            await deleteEntries([`${SHOW}/Season 1`, 'Unknown/notes.txt']),
          ).toEqual({
            deleted: 1,
            failed: [
              { path: `${SHOW}/Season 1`, error: 'EACCES: permission denied' },
            ],
          });
        } finally {
          chmodSync(locked, 0o755);
        }
        expect(existsSync(kept)).toBe(true);
        expect(existsSync(path.join(folder, 'Unknown/notes.txt'))).toBe(false);
        expect((await indexed()).map((file) => file.path)).toEqual([kept]);
        expect(await logged()).toEqual([
          `Deleted "${path.join(folder, 'Unknown/notes.txt')}": a test`,
        ]);
      });

      it('answers only for a library folder', async () => {
        await expect(deleteEntries(['tv'], root)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('deletes files and directories, and forgets the indexed files among them with their requests', async () => {
        const first = await importEpisode(write('downloads/S01E01.mkv'), [1]);
        const second = write(`tv/${SHOW}/Season 2/Test Show - S02E01.mkv`);
        write(`tv/${SHOW}/Season 2/poster.jpg`);
        write(`tv/${SHOW}/Season 3/Test Show - S03E01.mkv`);
        write('tv/Unknown/notes.txt');
        await scanSeries();
        const rows = await indexed();
        const firstRow = rows.find((row) => row.path === first);
        const secondRow = rows.find((row) => row.path === second);
        await bind('request-1', firstRow.id);
        const selected = {
          mediaFile: path.relative(folder, first),
          directory: `${SHOW}/Season 2`,
          file: 'Unknown/notes.txt',
        };

        // An entry inside a selected directory and one that is gone change nothing
        expect(
          await deleteEntries([
            ...Object.values(selected),
            `${SHOW}/Season 2/poster.jpg`,
            'Unknown/gone.txt',
          ]),
        ).toEqual({ deleted: 3, failed: [] });

        // The requests that held the files of an entry go with them
        expect(secondRow).toBeDefined();
        expect(
          requests.deleteRequests.mock.calls.map(([, ids]) => ids),
        ).toEqual([['request-1'], []]);
        // A directory that is left empty stays: it was not selected
        expect(
          readdirSync(folder, { recursive: true }).map(String).sort(),
        ).toEqual([
          SHOW,
          `${SHOW}/Season 1`,
          `${SHOW}/Season 3`,
          `${SHOW}/Season 3/Test Show - S03E01.mkv`,
          'Unknown',
        ]);
        expect((await indexed()).map((file) => file.season)).toEqual([3]);
        expect((await logged()).sort()).toEqual(
          [first, second, path.join(folder, selected.directory)]
            .concat(path.join(folder, selected.file))
            .map((deleted) => `Deleted "${deleted}": a test`)
            .sort(),
        );
        // The download is another link to the data and stays
        expect(existsSync(path.join(root, 'downloads/S01E01.mkv'))).toBe(true);
      });

      it('deletes the requests of a file whose row a scan forgot while the entry was deleted', async () => {
        write('tv/Test Show (2020)/Season 1/Test Show - S01E01.mkv');
        await scanSeries();
        const [row] = await indexed();
        await bind('request-1', row.id);
        const rm = fsPromises.rm;
        // A scan of the title forgets the row while the entry is deleted
        vi.spyOn(fsPromises, 'rm').mockImplementationOnce(async (...args) => {
          await rm(...args);
          await orm.em.fork().nativeDelete(MediaFile, { id: row.id });
        });

        await deleteEntries(['Test Show (2020)/Season 1']);

        expect(requests.deleteRequests).toHaveBeenCalledWith(
          expect.anything(),
          ['request-1'],
        );
      });

      it('deletes nothing outside the folder', async () => {
        write('elsewhere/secret.txt');
        write('tv/Unknown/notes.txt');
        symlinkSync(path.join(root, 'elsewhere'), path.join(folder, 'link'));

        for (const paths of [
          ['../elsewhere/secret.txt'],
          ['Unknown/../../elsewhere'],
          ['link/secret.txt'],
          // The folder itself
          ['.'],
          ['Unknown/..'],
          [''],
          'Unknown' as unknown as string[],
        ]) {
          await expect(deleteEntries(paths)).rejects.toThrow(
            BadRequestException,
          );
        }
        expect(existsSync(path.join(root, 'elsewhere/secret.txt'))).toBe(true);
        expect(existsSync(path.join(folder, 'Unknown/notes.txt'))).toBe(true);

        // A link is deleted, what it leads to is not
        await deleteEntries(['link']);
        expect(readdirSync(folder)).toEqual(['Unknown']);
        expect(existsSync(path.join(root, 'elsewhere/secret.txt'))).toBe(true);
      });
    });
  });
});
