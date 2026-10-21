import { MikroORM } from '@mikro-orm/sqlite';
import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import * as path from 'node:path';
import {
  createLibraryFixture,
  INFO_HASH,
  LibraryFixture,
  TMDB_ID,
} from '../../test/library-fixture.js';
import { MediaType } from '../common/common.dto.js';
import { LogEntry } from '../server-log/log-entry.entity.js';
import { DeletionService } from './deletion.service.js';
import { CleanupSchedule } from './library.dto.js';
import { LibraryService } from './library.service.js';
import { MediaFile } from './media-file.entity.js';

describe('LibraryService', () => {
  let fixture: LibraryFixture;
  let orm: MikroORM;
  let library: LibraryService;
  let deletion: DeletionService;
  let root: string;
  let folder: string;
  let jobs: LibraryFixture['jobs'];
  let tmdb: LibraryFixture['tmdb'];
  let request: LibraryFixture['request'];
  let write: LibraryFixture['write'];
  let indexed: LibraryFixture['indexed'];
  let importEpisode: LibraryFixture['importEpisode'];
  let scanSeries: LibraryFixture['scanSeries'];
  let saveFoldersAround: LibraryFixture['saveFoldersAround'];
  let bind: LibraryFixture['bind'];
  let reconciled: LibraryFixture['reconciled'];

  beforeEach(async () => {
    fixture = await createLibraryFixture();
    ({
      orm,
      libraryService: library,
      deletion,
      root,
      library: folder,
      jobs,
      tmdb,
      request,
      write,
      indexed,
      importEpisode,
      scanSeries,
      saveFoldersAround,
      bind,
      reconciled,
    } = fixture);
  });

  afterEach(() => fixture.close());

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
      path.join(folder, 'Test Show (2020)/Season 1/Test Show - S01E02-E03.mkv'),
    );

    expect(await scanSeries()).toMatchObject([{ id: files[0].id, size: 6 }]);
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
    const imported = await importEpisode(write('downloads/S01E01.mkv'), [1]);
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

  it('removes a library folder that has indexed files only when it may forget them', async () => {
    write('tv/Test Show (2020)/Season 1/Test Show - S01E01.mkv');
    await scanSeries();
    const other = path.join(root, 'other');
    mkdirSync(other);
    const move = (forgetFiles?: boolean) =>
      request(() =>
        library.updateSettings(
          {
            movieFolders: [],
            seriesFolders: [other],
            cleanup: CleanupSchedule.Daily,
          },
          { forgetFiles },
        ),
      );

    await expect(move()).rejects.toThrow(BadRequestException);
    expect(await indexed()).toHaveLength(1);

    await move(true);
    expect(await indexed()).toEqual([]);
  });

  it('reads what is indexed and asks for a sync, at once when a file is missing', async () => {
    const file = write('tv/Test Show (2020)/Season 1/Test Show - S01E01.mkv');
    await scanSeries();
    jobs.enqueue.mockClear();

    const soon = Date.now();
    expect(await request(() => library.listSeriesFiles(TMDB_ID))).toHaveLength(
      1,
    );
    const [, , , later] = jobs.enqueue.mock.calls[0] as unknown[];
    expect((later as { runAt: Date }).runAt.getTime()).toBeGreaterThan(
      soon + 20_000,
    );

    rmSync(file);
    jobs.enqueue.mockClear();
    expect(await request(() => library.listSeriesFiles(TMDB_ID))).toEqual([]);
    const [, , , now] = jobs.enqueue.mock.calls[0] as unknown[];
    expect((now as { runAt: Date }).runAt.getTime()).toBeLessThan(
      soon + 20_000,
    );
    // The row stays until the scan
    expect(await indexed()).toHaveLength(1);
  });

  it('serves a file and its subtitles by the id of the file', async () => {
    const video = write('tv/Test Show (2020)/Season 1/Test Show - S01E01.mkv');
    write(
      'tv/Test Show (2020)/Season 1/Test Show - S01E01.en.srt',
      '1\n00:00:01,000 --> 00:00:02,000\nHello\n',
    );
    write('tv/Test Show (2020)/Season 1/Test Show - S01E02.srt', 'other');
    write('tv/secret.srt', 'secret');

    const [file] = await scanSeries();
    expect(file.subtitles).toEqual([
      { fileName: 'Test Show - S01E01.en.srt', lang: 'en', label: 'en' },
    ]);

    expect(await request(() => library.getStreamPath(file.id))).toBe(video);
    expect(
      await request(() =>
        library.readSubtitles(file.id, 'Test Show - S01E01.en.srt'),
      ),
    ).toBe('WEBVTT\n\n1\n00:00:01.000 --> 00:00:02.000\nHello\n');

    for (const name of ['Test Show - S01E02.srt', '../../secret.srt']) {
      await expect(
        request(() => library.readSubtitles(file.id, name)),
      ).rejects.toThrow(NotFoundException);
    }
    await expect(
      request(() => library.getStreamPath('unknown')),
    ).rejects.toThrow(NotFoundException);

    // A file outside the library folders is not served, whatever the index says
    const other = path.join(root, 'other');
    mkdirSync(other);
    await saveFoldersAround([other]);
    await expect(request(() => library.getStreamPath(file.id))).rejects.toThrow(
      NotFoundException,
    );
  });

  describe('a library folder that is not available', () => {
    const disk = () => path.join(root, 'disk');
    const attempts = [
      () => scanSeries(),
      () => importEpisode(path.join(root, 'downloads/S01E03.mkv'), [3]),
      () => request(() => library.getLibraryEntries(folder)),
    ];

    const fillLibrary = async () => {
      write('tv/Test Show (2020) [tmdbid-100]/Season 1/Test Show - S01E02.mkv');
      await importEpisode(write('downloads/S01E01.mkv'), [1]);
      write('downloads/S01E03.mkv');
      await scanSeries();

      return indexed();
    };

    it('keeps the index of a folder that is empty and writes nothing to it', async () => {
      const before = await fillLibrary();
      expect(before.map((file) => file.managed)).toEqual([true, false]);

      // The disk is not mounted: its folder is there with nothing in it
      renameSync(folder, disk());
      mkdirSync(folder);
      writeFileSync(path.join(folder, '.DS_Store'), '');

      for (const attempt of attempts) {
        await expect(attempt()).rejects.toThrow(ServiceUnavailableException);
      }
      await expect(
        request(() => deletion.deleteManagedFile(before[0].id, 'a test')),
      ).rejects.toThrow('it is empty, but files are indexed in it');
      expect(readdirSync(folder)).toEqual(['.DS_Store']);
      expect(await indexed()).toEqual(before);

      // Mounted again, the files are what they were
      rmSync(folder, { recursive: true });
      renameSync(disk(), folder);

      expect((await scanSeries()).map((file) => file.id)).toEqual(
        before.map((file) => file.id),
      );
      expect(await indexed()).toEqual(before);
    });

    it('keeps the index of a folder that is missing', async () => {
      const before = await fillLibrary();
      renameSync(folder, disk());

      for (const attempt of attempts) {
        await expect(attempt()).rejects.toThrow(ServiceUnavailableException);
      }
      await expect(
        request(() => deletion.deleteManagedFile(before[0].id, 'a test')),
      ).rejects.toThrow('ENOENT: no such file or directory');
      expect(existsSync(folder)).toBe(false);
      expect(await indexed()).toEqual(before);
    });

    it('reads an empty folder that nothing is indexed in', async () => {
      expect(await scanSeries()).toEqual([]);
      expect(await request(() => library.getLibraryEntries(folder))).toEqual(
        [],
      );
    });

    it('forgets the files of a series whose folder is gone from a folder that has others', async () => {
      await fillLibrary();
      write('tv/Another Show (2020)/Season 1/Another Show - S01E01.mkv');
      rmSync(path.join(folder, 'Test Show (2020) [tmdbid-100]'), {
        recursive: true,
      });

      expect(await scanSeries()).toEqual([]);
      expect(await indexed()).toEqual([]);
    });
  });

  describe('scanning a library folder', () => {
    const scan = (options?: { evenIfUnavailable?: boolean }) =>
      request(() => library.scanFolder(folder, options));
    const preview = () => request(() => library.previewScan(folder));
    const rows = async () =>
      (await indexed()).map((file) => [
        path.relative(folder, file.path),
        file.tmdbId,
        file.season,
        file.episode,
      ]);

    it('indexes the folders it can tell the title of and forgets what is gone', async () => {
      write('tv/Test Show (2020) [tmdbid-100]/Season 1/Test Show - S01E01.mkv');
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

      expect(await scan()).toEqual({
        added: 3,
        updated: 0,
        forgotten: 0,
        unresolved: ['Unknown (1999)'],
        failed: [],
      });
      expect(await rows()).toEqual([
        ['Another Show (2021)/Season 1/Another Show - S01E02.mkv', '200', 1, 2],
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
      expect(await scan()).toMatchObject({
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
      expect(await scan()).toMatchObject({
        added: 0,
        updated: 1,
        forgotten: 1,
      });
      expect(reconciled()).toEqual(['request-a']);
      expect(await preview()).toMatchObject({ available: true, missing: [] });
    });

    it('leaves a managed file as it was imported', async () => {
      const imported = await importEpisode(write('downloads/S01E01.mkv'), [1]);
      const [before] = await indexed();
      writeFileSync(imported, 'changed in place');

      expect(await scan()).toMatchObject({
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
      write('tv/Test Show (2020) [tmdbid-100]/Season 2/Test Show - S02E01.mkv');
      await scan();
      chmodSync(path.dirname(locked), 0o000);

      try {
        expect(await scan()).toEqual({
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
      write('tv/Test Show (2020) [tmdbid-100]/Season 1/Test Show - S01E02.mkv');
      await importEpisode(write('downloads/S01E01.mkv'), [1]);
      await scan();

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

      await expect(scan()).rejects.toThrow(ServiceUnavailableException);
      expect(await preview()).toMatchObject({
        available: false,
        reason: `Library folder "${folder}" is not available: it is empty, but files are indexed in it`,
        missing: [{ episode: 1 }, { episode: 2 }],
      });
      expect(await indexed()).toHaveLength(2);
      expect(reconciled()).toEqual([]);
      await bind('request-b', (await indexed())[0].id);

      expect(await scan({ evenIfUnavailable: true })).toEqual({
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
      write('tv/Test Show (2020) [tmdbid-100]/Season 1/Test Show - S01E01.mkv');
      jobs.define.mockClear();
      library.onModuleInit();
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

  describe('managing the files of library entries', () => {
    const SHOW = 'Test Show (2020) [tmdbid-100]';

    it('finds the indexed files among entries, and marks them managed or external', async () => {
      const found = write(`tv/${SHOW}/Season 1/Test Show - S01E02.mkv`);
      write(`tv/${SHOW}/Season 1/notes.txt`);
      const imported = await importEpisode(write('downloads/S01E01.mkv'), [1]);
      await scanSeries();

      expect(
        (
          await request(() =>
            library.findLibraryEntryFiles(folder, [`${SHOW}/Season 1`]),
          )
        ).map((file) => [file.path, file.managed]),
      ).toEqual([
        [imported, true],
        [found, false],
      ]);
      expect(
        await request(() =>
          library.setLibraryEntriesManaged(folder, [`${SHOW}/Season 1`], true),
        ),
      ).toEqual({ changed: 1 });
      expect((await indexed()).map((file) => file.managed)).toEqual([
        true,
        true,
      ]);

      // Only the one file, and its origin is kept
      const external = await request(() =>
        library.setLibraryEntriesManaged(
          folder,
          [`${SHOW}/Season 1/${path.basename(imported)}`],
          false,
        ),
      );
      expect(external).toMatchObject({ changed: 1 });
      expect(await indexed()).toMatchObject([
        { path: imported, managed: false, infoHash: INFO_HASH },
        { path: found, managed: true },
      ]);
    });

    it('answers only for a library folder', async () => {
      await expect(
        request(() => library.setLibraryEntriesManaged(root, ['tv'], true)),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('the entries of a library folder', () => {
    const SHOW = 'Test Show (2020) [tmdbid-100]';
    const entries = () => request(() => library.getLibraryEntries(folder));

    it('lists everything in the folder, a directory before what is in it', async () => {
      write(`tv/${SHOW}/Season 1/Test Show - S01E02.mkv`);
      const imported = await importEpisode(
        write('downloads/S01E01.mkv', 'episode one'),
        [1],
      );
      write(`tv/${SHOW}/Season 1/Test Show - S01E02.en.srt`, 'subtitles');
      write(`tv/${SHOW}/.hidden`, '');
      write('tv/Unknown/notes.txt', 'notes');
      await scanSeries();
      const [managed, found] = await indexed();

      expect(await entries()).toEqual([
        { path: SHOW, isDirectory: true, size: 0 },
        { path: `${SHOW}/.hidden`, isDirectory: false, size: 0 },
        { path: `${SHOW}/Season 1`, isDirectory: true, size: 0 },
        {
          path: `${SHOW}/Season 1/${path.basename(imported)}`,
          isDirectory: false,
          size: 11,
          mediaFileId: managed.id,
          managed: true,
        },
        {
          path: `${SHOW}/Season 1/Test Show - S01E02.en.srt`,
          isDirectory: false,
          size: 9,
        },
        {
          path: `${SHOW}/Season 1/Test Show - S01E02.mkv`,
          isDirectory: false,
          size: 5,
          mediaFileId: found.id,
          managed: false,
        },
        { path: 'Unknown', isDirectory: true, size: 0 },
        { path: 'Unknown/notes.txt', isDirectory: false, size: 5 },
      ]);
    });

    it('lists a link without following it', async () => {
      write('elsewhere/secret.txt', 'secret');
      symlinkSync(path.join(root, 'elsewhere'), path.join(folder, 'link'));
      symlinkSync(path.join(root, 'nowhere'), path.join(folder, 'broken'));

      expect(await entries()).toEqual([
        {
          path: 'broken',
          isDirectory: false,
          size: 0,
          error: 'ENOENT: no such file or directory',
        },
        { path: 'link', isDirectory: false, size: 0 },
      ]);
    });

    it('lists a directory that it cannot read and goes on', async () => {
      write('tv/Locked/secret.mkv');
      write('tv/Open/notes.txt');
      const locked = path.join(folder, 'Locked');
      chmodSync(locked, 0o000);

      try {
        expect(await entries()).toEqual([
          {
            path: 'Locked',
            isDirectory: true,
            size: 0,
            error: 'EACCES: permission denied',
          },
          { path: 'Open', isDirectory: true, size: 0 },
          { path: 'Open/notes.txt', isDirectory: false, size: 5 },
        ]);
      } finally {
        chmodSync(locked, 0o755);
      }
    });

    it('answers only for a library folder', async () => {
      await expect(
        request(() => library.getLibraryEntries(root)),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
