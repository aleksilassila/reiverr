import { RequestContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { MetadataService } from '../metadata/metadata.service.js';
import mikroOrmConfig from '../mikro-orm.config.js';
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

  const getSeriesFiles = () =>
    request(() => localMedia.getSeriesFiles(TMDB_ID));

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
      new EventEmitter2(),
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

  it('imports a file as a managed version of the episode', async () => {
    write('tv/Test Show (2020)/Season 01/Test Show - S01E02.mkv');
    const source = write('downloads/Test.Show.S01E02.1080p.MKV', 'download');

    const destination = await importEpisode(source, [2]);

    expect(path.relative(library, destination)).toBe(
      'Test Show (2020)/Season 01/Test Show - S01E02 - a1b2c3d4.mkv',
    );
    expect(statSync(destination).ino).toBe(statSync(source).ino);

    // The file found next to it stays as it is, and both play as the episode
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
    await request(() =>
      localMedia.updateSettings({ movieFolders: [], seriesFolders: [other] }),
    );
    await expect(
      request(() => localMedia.resolveFilePath(file.id)),
    ).rejects.toThrow(NotFoundException);
  });

  describe('deleting a managed file', () => {
    const deleteFile = (id: string) =>
      request(() => localMedia.deleteManagedFile(id));
    const idOf = async (filePath: string) =>
      (await indexed()).find((file) => file.path === filePath).id;

    it('deletes the file with the folders it leaves empty', async () => {
      const first = await importEpisode(write('downloads/S01E01.mkv'), [1]);
      const second = await importEpisode(write('downloads/S01E02.mkv'), [2]);
      const seasonFolder = path.dirname(first);

      await deleteFile(await idOf(first));
      expect(readdirSync(seasonFolder)).toEqual([path.basename(second)]);
      expect((await indexed()).map((file) => file.path)).toEqual([second]);

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
    });

    it('keeps a file that the library folders no longer contain', async () => {
      const imported = await importEpisode(write('downloads/S01E01.mkv'), [1]);
      const id = await idOf(imported);
      await request(() =>
        localMedia.updateSettings({
          movieFolders: [],
          seriesFolders: [path.join(root, 'downloads')],
        }),
      );

      await deleteFile(id);

      expect(existsSync(imported)).toBe(true);
      expect(await indexed()).toMatchObject([{ id, managed: false }]);
    });

    it('forgets a file that is already gone', async () => {
      const imported = await importEpisode(write('downloads/S01E01.mkv'), [1]);
      const id = await idOf(imported);
      rmSync(imported);

      await deleteFile(id);

      expect(await indexed()).toEqual([]);
    });
  });
});
