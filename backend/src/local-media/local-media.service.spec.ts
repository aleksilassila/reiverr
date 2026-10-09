import { RequestContext } from '@mikro-orm/core';
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
  mkdtempSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { MediaType } from '../common/common.dto.js';
import { JobsService } from '../jobs/jobs.service.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { RequestsService } from '../requests/requests.service.js';
import mikroOrmConfig from '../mikro-orm.config.js';
import { LogEntry } from '../server-log/log-entry.entity.js';
import { ServerLogService } from '../server-log/server-log.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { LocalMediaService } from './local-media.service.js';
import { MediaFile } from './media-file.entity.js';

const TMDB_ID = '100';
const INFO_HASH = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678';

describe('LocalMediaService', () => {
  let orm: MikroORM;
  let localMedia: LocalMediaService;
  let root: string;
  let library: string;

  // Every call gets its own entity manager, as every HTTP request does
  const request = <T>(run: () => Promise<T>) =>
    RequestContext.create(orm.em, run);

  const write = (file: string, content = 'video') => {
    const filePath = path.join(root, file);
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, content);

    return filePath;
  };

  const jobs = {
    runNow: async () => {},
    enqueue: vi.fn(async () => {}),
    define: () => {},
  };

  /** Library folders that changed without the service, which forgets nothing */
  const saveFoldersAround = (seriesFolders: string[]) =>
    request(() =>
      new SettingsService(orm.em).saveValue('local-media', {
        movieFolders: [],
        seriesFolders,
      }),
    );

  /** A sync of the series, which the job does, and what is on disk then */
  const getSeriesFiles = async (tmdbId = TMDB_ID) => {
    await request(() => localMedia.syncTitle(MediaType.Series, tmdbId));

    return request(() => localMedia.getSeriesFiles(tmdbId));
  };

  const indexed = () =>
    orm.em.fork().find(MediaFile, {}, { orderBy: { path: 'asc' } });

  const importEpisode = (sourcePath: string, episodes: number[]) =>
    request(() =>
      localMedia.importEpisodeFile({
        tmdbId: TMDB_ID,
        season: 1,
        episodes,
        sourcePath,
        infoHash: INFO_HASH,
      }),
    );

  beforeEach(async () => {
    root = mkdtempSync(path.join(tmpdir(), 'reiverr-local-media-'));
    library = path.join(root, 'tv');
    mkdirSync(library);

    orm = await MikroORM.init({ ...mikroOrmConfig, dbName: ':memory:' });
    await orm.migrator.up();

    const metadata = {
      getSeriesByTmdbId: async () => ({
        tmdbSeries: { name: 'Test Show', first_air_date: '2020-01-01' },
      }),
    };
    localMedia = new LocalMediaService(
      orm.em,
      new SettingsService(orm.em),
      metadata as unknown as MetadataService,
      { enqueueTorrentsOfFiles: async () => {} } as unknown as RequestsService,
      jobs as unknown as JobsService,
      new ServerLogService(orm.em, new SettingsService(orm.em)),
    );
    await request(() =>
      localMedia.updateSettings({ movieFolders: [], seriesFolders: [library] }),
    );
  });

  afterEach(async () => {
    await orm.close();
    rmSync(root, { recursive: true });
  });

  it('indexes the files it finds as unmanaged files and keeps their ids', async () => {
    write('tv/Test Show (2020)/Season 01/Test Show - S01E01.mkv');
    write('tv/Test Show (2020)/Season 01/Test Show - S01E02-E03.mkv');
    write('tv/Test Show (2020)/Season 01/notes.txt');
    write('tv/Another Show (2020)/Season 01/Another Show - S01E01.mkv');

    const files = await getSeriesFiles();

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
    write('tv/Test Show (2020)/Season 01/Test Show - S01E01.mkv', 'longer');
    rmSync(
      path.join(
        library,
        'Test Show (2020)/Season 01/Test Show - S01E02-E03.mkv',
      ),
    );

    expect(await getSeriesFiles()).toMatchObject([
      { id: files[0].id, size: 6 },
    ]);
    expect(await indexed()).toMatchObject([{ id: files[0].id, size: 6 }]);
  });

  it('forgets an indexed file only when it is gone or outside the title folders', async () => {
    // A name that the walk passes over, like a file that is imported while it runs
    const kept = write('tv/Test Show (2020)/Season 01/importing.mkv');
    const otherFolder = write('tv/Other Folder/Test Show - S01E04.mkv');
    const outside = write('elsewhere/Test Show - S01E06.mkv');
    const gone = path.join(library, 'Test Show (2020)/Season 01/S01E07.mkv');
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
    write('tv/Test Show (2020)/Season 01/Test Show - S01E01.mkv');

    await getSeriesFiles();

    expect((await indexed()).map((file) => file.path)).toEqual([
      path.join(library, 'Test Show (2020)/Season 01/Test Show - S01E01.mkv'),
      path.join(library, 'Test Show (2020)/Season 01/importing.mkv'),
    ]);
  });

  it('leaves a managed file as it was imported', async () => {
    // A folder without an id tag, which a lookup of another title matches too
    write('tv/Test Show (2020)/Season 01/notes.txt');
    const imported = await importEpisode(write('downloads/S01E01.mkv'), [1]);
    const [before] = await indexed();
    writeFileSync(imported, 'changed in place');

    await getSeriesFiles();
    // A lookup of another title that matches the same folder
    await getSeriesFiles('200');

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

  it('removes a library folder that has indexed files only with force, forgetting them', async () => {
    write('tv/Test Show (2020)/Season 01/Test Show - S01E01.mkv');
    await getSeriesFiles();
    const other = path.join(root, 'other');
    mkdirSync(other);
    const move = (force?: boolean) =>
      request(() =>
        localMedia.updateSettings(
          { movieFolders: [], seriesFolders: [other] },
          force,
        ),
      );

    await expect(move()).rejects.toThrow(BadRequestException);
    expect(await indexed()).toHaveLength(1);

    await move(true);
    expect(await indexed()).toEqual([]);
  });

  it('reads what is indexed and asks for a sync, at once when a file is missing', async () => {
    const file = write('tv/Test Show (2020)/Season 01/Test Show - S01E01.mkv');
    await getSeriesFiles();
    jobs.enqueue.mockClear();

    const soon = Date.now();
    expect(
      await request(() => localMedia.getSeriesFiles(TMDB_ID)),
    ).toHaveLength(1);
    const [, , , later] = jobs.enqueue.mock.calls[0] as unknown[];
    expect((later as { runAt: Date }).runAt.getTime()).toBeGreaterThan(
      soon + 20_000,
    );

    rmSync(file);
    jobs.enqueue.mockClear();
    expect(await request(() => localMedia.getSeriesFiles(TMDB_ID))).toEqual([]);
    const [, , , now] = jobs.enqueue.mock.calls[0] as unknown[];
    expect((now as { runAt: Date }).runAt.getTime()).toBeLessThan(
      soon + 20_000,
    );
    // The row stays until the sync
    expect(await indexed()).toHaveLength(1);
  });

  it('imports a file as a managed version of the episode', async () => {
    write('tv/Test Show (2020)/Season 01/Test Show - S01E02.mkv');
    const source = write('downloads/Test.Show.S01E02.1080p.MKV', 'download');

    const destination = await importEpisode(source, [2]);

    expect(path.relative(library, destination)).toBe(
      'Test Show (2020)/Season 01/Test Show - S01E02 - a1b2c3d4.mkv',
    );
    expect(statSync(destination).ino).toBe(statSync(source).ino);

    // The file found next to it stays as it is, and both play as the episode
    await request(() => localMedia.syncTitle(MediaType.Series, TMDB_ID));
    const files = await request(() =>
      localMedia.getEpisodeFiles(TMDB_ID, 1, 2),
    );
    expect(files.map((file) => file.fileName)).toEqual([
      'Test Show - S01E02 - a1b2c3d4.mkv',
      'Test Show - S01E02.mkv',
    ]);
    expect((await indexed()).map((f) => [f.managed, f.infoHash])).toEqual([
      [true, INFO_HASH],
      [false, null],
    ]);

    // Importing the same file of the torrent again changes nothing
    await importEpisode(source, [2]);
    expect(readdirSync(path.dirname(destination))).toHaveLength(2);
    expect((await indexed()).map((f) => f.id)).toEqual([
      files[0].id,
      files[1].id,
    ]);
  });

  it('creates the folder of a series that is not in the library yet', async () => {
    const source = write('downloads/pack/Test.Show.S01E02E03.mkv');

    const destination = await importEpisode(source, [2, 3]);

    expect(path.relative(library, destination)).toBe(
      'Test Show (2020) [tmdbid-100]/Season 01/Test Show - S01E02-E03 - a1b2c3d4.mkv',
    );
    expect(await getSeriesFiles()).toMatchObject([
      { season: 1, episodes: [2, 3] },
    ]);
    expect(await indexed()).toMatchObject([
      { managed: true, infoHash: INFO_HASH, episode: 2, lastEpisode: 3 },
    ]);
  });

  it('serves a file and its subtitles by the id of the file', async () => {
    const video = write('tv/Test Show (2020)/Season 01/Test Show - S01E01.mkv');
    write(
      'tv/Test Show (2020)/Season 01/Test Show - S01E01.en.srt',
      '1\n00:00:01,000 --> 00:00:02,000\nHello\n',
    );
    write('tv/Test Show (2020)/Season 01/Test Show - S01E02.srt', 'other');
    write('tv/secret.srt', 'secret');

    const [file] = await getSeriesFiles();
    expect(file.subtitles).toEqual([
      { fileName: 'Test Show - S01E01.en.srt', lang: 'en', label: 'en' },
    ]);

    expect(await request(() => localMedia.resolveFilePath(file.id))).toBe(
      video,
    );
    expect(
      await request(() =>
        localMedia.readSubtitles(file.id, 'Test Show - S01E01.en.srt'),
      ),
    ).toBe('WEBVTT\n\n1\n00:00:01.000 --> 00:00:02.000\nHello\n');

    for (const name of ['Test Show - S01E02.srt', '../../secret.srt']) {
      await expect(
        request(() => localMedia.readSubtitles(file.id, name)),
      ).rejects.toThrow(NotFoundException);
    }
    await expect(
      request(() => localMedia.resolveFilePath('unknown')),
    ).rejects.toThrow(NotFoundException);

    // A file outside the library folders is not served, whatever the index says
    const other = path.join(root, 'other');
    mkdirSync(other);
    await saveFoldersAround([other]);
    await expect(
      request(() => localMedia.resolveFilePath(file.id)),
    ).rejects.toThrow(NotFoundException);
  });

  describe('a library folder that is not available', () => {
    const disk = () => path.join(root, 'disk');
    const attempts = [
      () => getSeriesFiles(),
      () => importEpisode(path.join(root, 'downloads/S01E03.mkv'), [3]),
      () => request(() => localMedia.getLibraryEntries(library)),
    ];

    const fillLibrary = async () => {
      await importEpisode(write('downloads/S01E01.mkv'), [1]);
      write(
        'tv/Test Show (2020) [tmdbid-100]/Season 01/Test Show - S01E02.mkv',
      );
      write('downloads/S01E03.mkv');
      await getSeriesFiles();

      return indexed();
    };

    it('keeps the index of a folder that is empty and writes nothing to it', async () => {
      const before = await fillLibrary();
      expect(before.map((file) => file.managed)).toEqual([true, false]);

      // The disk is not mounted: its folder is there with nothing in it
      renameSync(library, disk());
      mkdirSync(library);
      writeFileSync(path.join(library, '.DS_Store'), '');

      for (const attempt of attempts) {
        await expect(attempt()).rejects.toThrow(ServiceUnavailableException);
      }
      await expect(
        request(() => localMedia.deleteManagedFile(before[0].id, 'a test')),
      ).rejects.toThrow('it is empty, but files are indexed in it');
      expect(readdirSync(library)).toEqual(['.DS_Store']);
      expect(await indexed()).toEqual(before);

      // Mounted again, the files are what they were
      rmSync(library, { recursive: true });
      renameSync(disk(), library);

      expect((await getSeriesFiles()).map((file) => file.id)).toEqual(
        before.map((file) => file.id),
      );
      expect(await indexed()).toEqual(before);
    });

    it('keeps the index of a folder that is missing', async () => {
      const before = await fillLibrary();
      renameSync(library, disk());

      for (const attempt of attempts) {
        await expect(attempt()).rejects.toThrow(ServiceUnavailableException);
      }
      await expect(
        request(() => localMedia.deleteManagedFile(before[0].id, 'a test')),
      ).rejects.toThrow('ENOENT: no such file or directory');
      expect(existsSync(library)).toBe(false);
      expect(await indexed()).toEqual(before);
    });

    it('reads an empty folder that nothing is indexed in', async () => {
      expect(await getSeriesFiles()).toEqual([]);
      expect(
        await request(() => localMedia.getLibraryEntries(library)),
      ).toEqual([]);
    });

    it('forgets the files of a series whose folder is gone from a folder that has others', async () => {
      await fillLibrary();
      write('tv/Another Show (2020)/Season 01/Another Show - S01E01.mkv');
      rmSync(path.join(library, 'Test Show (2020) [tmdbid-100]'), {
        recursive: true,
      });

      expect(await getSeriesFiles()).toEqual([]);
      expect(await indexed()).toEqual([]);
    });
  });

  describe('deleting a managed file', () => {
    const deleteFile = (id: string) =>
      request(() => localMedia.deleteManagedFile(id, 'a test'));
    const logged = () => orm.em.fork().find(LogEntry, {});
    const idOf = async (filePath: string) =>
      (await indexed()).find((file) => file.path === filePath).id;

    it('deletes the file with the folders it leaves empty', async () => {
      const first = await importEpisode(write('downloads/S01E01.mkv'), [1]);
      const second = await importEpisode(write('downloads/S01E02.mkv'), [2]);
      const seasonFolder = path.dirname(first);

      await deleteFile(await idOf(first));
      expect(readdirSync(seasonFolder)).toEqual([path.basename(second)]);
      expect((await indexed()).map((file) => file.path)).toEqual([second]);
      expect(await logged()).toMatchObject([
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
      const imported = await importEpisode(write('downloads/S01E01.mkv'), [1]);
      const seasonFolder = path.dirname(imported);
      writeFileSync(path.join(seasonFolder, 'notes.txt'), 'notes');

      await deleteFile(await idOf(imported));

      expect(readdirSync(seasonFolder)).toEqual(['notes.txt']);
    });

    it('keeps a file that is not as it was imported and stops managing it', async () => {
      const imported = await importEpisode(write('downloads/S01E01.mkv'), [1]);
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
      const imported = await importEpisode(write('downloads/S01E01.mkv'), [1]);
      const id = await idOf(imported);
      rmSync(imported);
      writeFileSync(imported, 'other');
      const later = new Date(Date.now() + 60_000);
      utimesSync(imported, later, later);
      // A lookup in between does not make the new file look imported
      await getSeriesFiles();

      await deleteFile(id);

      expect(existsSync(imported)).toBe(true);
      expect(await indexed()).toMatchObject([{ id, managed: false }]);
    });

    it('keeps a file that the library folders no longer contain', async () => {
      const imported = await importEpisode(write('downloads/S01E01.mkv'), [1]);
      const id = await idOf(imported);
      await saveFoldersAround([path.join(root, 'downloads')]);

      await deleteFile(id);

      expect(existsSync(imported)).toBe(true);
      expect(await indexed()).toMatchObject([{ id, managed: false }]);
    });

    it('lets the caller act on the file in the transaction that forgets it', async () => {
      const imported = await importEpisode(write('downloads/S01E01.mkv'), [1]);
      const id = await idOf(imported);
      const forget = vi.fn(async (tx, files) => {
        expect(tx.isInTransaction()).toBe(true);
        // The row is still there
        expect(await tx.count(MediaFile, { id: files[0].id })).toBe(1);
      });

      await request(() => localMedia.deleteManagedFile(id, 'a test', forget));

      expect(forget).toHaveBeenCalledWith(expect.anything(), [
        expect.objectContaining({ id, path: imported }),
      ]);
      expect(await indexed()).toEqual([]);
    });

    it('forgets a file that is already gone', async () => {
      const imported = await importEpisode(write('downloads/S01E01.mkv'), [1]);
      const id = await idOf(imported);
      rmSync(imported);

      await deleteFile(id);

      expect(await indexed()).toEqual([]);
    });
  });

  describe('the entries of a library folder', () => {
    const SHOW = 'Test Show (2020) [tmdbid-100]';
    const entries = () => request(() => localMedia.getLibraryEntries(library));
    const deleteEntries = (paths: string[], folder = library) =>
      request(() => localMedia.deleteLibraryEntries(folder, paths, 'a test'));
    const logged = async () =>
      (await orm.em.fork().find(LogEntry, {})).map((entry) => entry.message);

    it('lists everything in the folder, a directory before what is in it', async () => {
      const imported = await importEpisode(
        write('downloads/S01E01.mkv', 'episode one'),
        [1],
      );
      write(`tv/${SHOW}/Season 01/Test Show - S01E02.mkv`);
      write(`tv/${SHOW}/Season 01/Test Show - S01E02.en.srt`, 'subtitles');
      write(`tv/${SHOW}/.hidden`, '');
      write('tv/Unknown/notes.txt', 'notes');
      await getSeriesFiles();
      const [managed, found] = await indexed();

      expect(await entries()).toEqual([
        { path: SHOW, isDirectory: true, size: 0 },
        { path: `${SHOW}/.hidden`, isDirectory: false, size: 0 },
        { path: `${SHOW}/Season 01`, isDirectory: true, size: 0 },
        {
          path: `${SHOW}/Season 01/${path.basename(imported)}`,
          isDirectory: false,
          size: 11,
          mediaFileId: managed.id,
          managed: true,
        },
        {
          path: `${SHOW}/Season 01/Test Show - S01E02.en.srt`,
          isDirectory: false,
          size: 9,
        },
        {
          path: `${SHOW}/Season 01/Test Show - S01E02.mkv`,
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
      symlinkSync(path.join(root, 'elsewhere'), path.join(library, 'link'));
      symlinkSync(path.join(root, 'nowhere'), path.join(library, 'broken'));

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
      const locked = path.join(library, 'Locked');
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

    it('deletes what it can and reports what it cannot', async () => {
      const kept = write(`tv/${SHOW}/Season 01/Test Show - S01E01.mkv`);
      write('tv/Unknown/notes.txt');
      await getSeriesFiles();
      const locked = path.dirname(kept);
      chmodSync(locked, 0o555);

      try {
        expect(
          await deleteEntries([`${SHOW}/Season 01`, 'Unknown/notes.txt']),
        ).toEqual({
          deleted: 1,
          failed: [
            { path: `${SHOW}/Season 01`, error: 'EACCES: permission denied' },
          ],
          files: [],
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
      await expect(
        request(() => localMedia.getLibraryEntries(root)),
      ).rejects.toThrow(BadRequestException);
      await expect(deleteEntries(['tv'], root)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deletes files and directories, and forgets the indexed files among them', async () => {
      const first = await importEpisode(write('downloads/S01E01.mkv'), [1]);
      const second = write(`tv/${SHOW}/Season 02/Test Show - S02E01.mkv`);
      write(`tv/${SHOW}/Season 02/poster.jpg`);
      write(`tv/${SHOW}/Season 03/Test Show - S03E01.mkv`);
      write('tv/Unknown/notes.txt');
      await getSeriesFiles();
      const selected = {
        mediaFile: `${SHOW}/Season 01/${path.basename(first)}`,
        directory: `${SHOW}/Season 02`,
        file: 'Unknown/notes.txt',
      };

      expect(
        (
          await request(() =>
            localMedia.findLibraryFiles(library, Object.values(selected)),
          )
        )
          .map((file) => file.path)
          .sort(),
      ).toEqual([first, second]);

      // An entry inside a selected directory and one that is gone change nothing
      expect(
        await deleteEntries([
          ...Object.values(selected),
          `${SHOW}/Season 02/poster.jpg`,
          'Unknown/gone.txt',
        ]),
      ).toMatchObject({
        deleted: 3,
        failed: [],
        files: [{ path: first }, { path: second }],
      });

      // A directory that is left empty stays: it was not selected
      expect(
        readdirSync(library, { recursive: true }).map(String).sort(),
      ).toEqual([
        SHOW,
        `${SHOW}/Season 01`,
        `${SHOW}/Season 03`,
        `${SHOW}/Season 03/Test Show - S03E01.mkv`,
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
        await expect(deleteEntries(paths)).rejects.toThrow(BadRequestException);
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
