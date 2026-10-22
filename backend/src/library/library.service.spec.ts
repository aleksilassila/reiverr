import {
  BadRequestException,
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
} from '../../test/library-fixture.js';
import { DeletionService } from './deletion.service.js';
import { CleanupSchedule } from './library.dto.js';
import { LibraryService } from './library.service.js';

describe('LibraryService', () => {
  let fixture: LibraryFixture;
  let library: LibraryService;
  let deletion: DeletionService;
  let root: string;
  let folder: string;
  let request: LibraryFixture['request'];
  let write: LibraryFixture['write'];
  let indexed: LibraryFixture['indexed'];
  let importEpisode: LibraryFixture['importEpisode'];
  let scanSeries: LibraryFixture['scanSeries'];

  beforeEach(async () => {
    fixture = await createLibraryFixture();
    ({
      libraryService: library,
      deletion,
      root,
      library: folder,
      request,
      write,
      indexed,
      importEpisode,
      scanSeries,
    } = fixture);
  });

  afterEach(() => fixture.close());

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
            maxDiskUsagePercent: null,
          },
          { forgetFiles },
        ),
      );

    await expect(move()).rejects.toThrow(BadRequestException);
    expect(await indexed()).toHaveLength(1);

    await move(true);
    expect(await indexed()).toEqual([]);
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
