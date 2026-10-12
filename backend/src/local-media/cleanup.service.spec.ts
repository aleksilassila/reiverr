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
} from '../../test/local-media-fixture.js';
import { CleanupSchedule } from '../downloads/downloads.dto.js';
import { DownloadsService } from '../downloads/downloads.service.js';
import { Job } from '../jobs/job.entity.js';
import { JobsService } from '../jobs/jobs.service.js';
import mikroOrmConfig from '../mikro-orm.config.js';
import { RequestsService } from '../requests/requests.service.js';
import { LogEntry } from '../server-log/log-entry.entity.js';
import { ServerLogService } from '../server-log/server-log.service.js';
import { CleanupService } from './cleanup.service.js';
import { LocalMediaService } from './local-media.service.js';
import { MediaFile } from './media-file.entity.js';

describe('CleanupService', () => {
  describe('the cleanup hour', () => {
    let orm: MikroORM;
    let cleanupService: CleanupService;
    let cleanup: CleanupSchedule;

    const queued = async () =>
      (
        await orm.em.fork().find(Job, {}, { orderBy: { dedupeKey: 'asc' } })
      ).map((job) => [job.type, job.payload]);

    beforeEach(async () => {
      orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
      await orm.migrator.up();

      const localMedia = {
        getSettings: async () => ({
          movieFolders: ['/movies'],
          seriesFolders: ['/tv', '/anime'],
        }),
      };
      const downloads = {
        getSettings: async () => ({ seedRatio: 0, cleanup }),
      };
      cleanupService = new CleanupService(
        orm.em,
        new JobsService(orm.em),
        localMedia as unknown as LocalMediaService,
        downloads as unknown as DownloadsService,
        {} as RequestsService,
        {} as ServerLogService,
      );
    });

    afterEach(() => orm.close());

    it('queues a scan of every library folder every night, and the cleanup on cleanup days', async () => {
      cleanup = CleanupSchedule.Off;
      await cleanupService.onCleanupHour();

      expect(await queued()).toEqual([
        ['localMedia.scanFolder', { folder: '/anime' }],
        ['localMedia.scanFolder', { folder: '/movies' }],
        ['localMedia.scanFolder', { folder: '/tv' }],
      ]);

      // The scans that have not run yet are not queued twice
      cleanup = CleanupSchedule.Daily;
      await cleanupService.onCleanupHour();

      expect(await queued()).toEqual([
        ['localMedia.cleanUpLibrary', {}],
        ['localMedia.scanFolder', { folder: '/anime' }],
        ['localMedia.scanFolder', { folder: '/movies' }],
        ['localMedia.scanFolder', { folder: '/tv' }],
      ]);
    });
  });

  describe('with a library', () => {
    let fixture: LibraryFixture;
    let orm: MikroORM;
    let cleanup: CleanupService;
    let root: string;
    let library: string;
    let jobs: LibraryFixture['jobs'];
    let requests: LibraryFixture['requests'];
    let request: LibraryFixture['request'];
    let write: LibraryFixture['write'];
    let indexed: LibraryFixture['indexed'];
    let importEpisode: LibraryFixture['importEpisode'];
    let scanSeries: LibraryFixture['scanSeries'];
    let saveFoldersAround: LibraryFixture['saveFoldersAround'];
    let reconciled: LibraryFixture['reconciled'];

    const logged = async () =>
      (await orm.em.fork().find(LogEntry, {})).map((entry) => entry.message);
    const idOf = async (filePath: string) =>
      (await indexed()).find((file) => file.path === filePath).id;

    beforeEach(async () => {
      fixture = await createLibraryFixture();
      ({
        orm,
        cleanup,
        root,
        library,
        jobs,
        requests,
        request,
        write,
        indexed,
        importEpisode,
        scanSeries,
        saveFoldersAround,
        reconciled,
      } = fixture);
    });

    afterEach(() => fixture.close());

    describe('deleting a managed file', () => {
      const deleteFile = (id: string) =>
        request(() => cleanup.deleteManagedFile(id, 'a test'));

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
        expect(readdirSync(library)).toEqual([]);
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

      it('reconciles the title in the transaction that forgets the row', async () => {
        const imported = await importEpisode(
          write('downloads/S01E01.mkv'),
          [1],
        );
        const id = await idOf(imported);
        jobs.enqueue.mockImplementationOnce(async (tx) => {
          expect(tx.isInTransaction()).toBe(true);
          // The row is still there
          expect(await tx.count(MediaFile, { id })).toBe(1);
        });

        await deleteFile(id);

        expect(reconciled()).toEqual([
          { mediaType: 'series', tmdbId: TMDB_ID },
        ]);
        expect(await indexed()).toEqual([]);
      });

      it('forgets a file that is already gone', async () => {
        const imported = await importEpisode(
          write('downloads/S01E01.mkv'),
          [1],
        );
        const id = await idOf(imported);
        rmSync(imported);

        await deleteFile(id);

        expect(await indexed()).toEqual([]);
        expect(await logged()).toEqual([
          `Deleted "${imported}": a test, it was gone already`,
        ]);
        expect(reconciled()).toEqual([
          { mediaType: 'series', tmdbId: TMDB_ID },
        ]);
      });
    });

    describe('deleting the entries of a library folder', () => {
      const SHOW = 'Test Show (2020) [tmdbid-100]';
      const deleteEntries = (paths: string[], folder = library) =>
        request(() => cleanup.deleteLibraryEntries(folder, paths, 'a test'));

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
        expect(existsSync(path.join(library, 'Unknown/notes.txt'))).toBe(false);
        expect((await indexed()).map((file) => file.path)).toEqual([kept]);
        expect(await logged()).toEqual([
          `Deleted "${path.join(library, 'Unknown/notes.txt')}": a test`,
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
        requests.findReferringRequests.mockResolvedValueOnce([
          { id: 'request-1', mediaFileId: firstRow.id },
        ]);
        const selected = {
          mediaFile: path.relative(library, first),
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

        // The requests were read for the files of every entry before the deletion
        expect(requests.findReferringRequests).toHaveBeenCalledWith([
          firstRow.id,
          secondRow.id,
        ]);
        expect(
          requests.deleteRequests.mock.calls.map(([, where]) => where),
        ).toEqual([
          { ids: ['request-1'], mediaFileIds: [firstRow.id] },
          { ids: [], mediaFileIds: [secondRow.id] },
        ]);
        // A directory that is left empty stays: it was not selected
        expect(
          readdirSync(library, { recursive: true }).map(String).sort(),
        ).toEqual([
          SHOW,
          `${SHOW}/Season 1`,
          `${SHOW}/Season 3`,
          `${SHOW}/Season 3/Test Show - S03E01.mkv`,
          'Unknown',
        ]);
        expect((await indexed()).map((file) => file.season)).toEqual([3]);
        expect((await logged()).sort()).toEqual(
          [first, second, path.join(library, selected.directory)]
            .concat(path.join(library, selected.file))
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
        requests.findReferringRequests.mockResolvedValueOnce([
          { id: 'request-1', mediaFileId: row.id },
        ]);
        const rm = fsPromises.rm;
        // A scan of the title forgets the row while the entry is deleted
        vi.spyOn(fsPromises, 'rm').mockImplementationOnce(async (...args) => {
          await rm(...args);
          await orm.em.fork().nativeDelete(MediaFile, { id: row.id });
        });

        await deleteEntries(['Test Show (2020)/Season 1']);

        expect(requests.deleteRequests).toHaveBeenCalledWith(
          expect.anything(),
          { ids: ['request-1'], mediaFileIds: [row.id] },
        );
      });

      it('deletes nothing outside the folder', async () => {
        write('elsewhere/secret.txt');
        write('tv/Unknown/notes.txt');
        symlinkSync(path.join(root, 'elsewhere'), path.join(library, 'link'));

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
        expect(existsSync(path.join(library, 'Unknown/notes.txt'))).toBe(true);

        // A link is deleted, what it leads to is not
        await deleteEntries(['link']);
        expect(readdirSync(library)).toEqual(['Unknown']);
        expect(existsSync(path.join(root, 'elsewhere/secret.txt'))).toBe(true);
      });
    });
  });
});
