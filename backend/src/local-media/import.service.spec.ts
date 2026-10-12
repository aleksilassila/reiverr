import { readdirSync, statSync } from 'node:fs';
import * as path from 'node:path';
import {
  createLibraryFixture,
  INFO_HASH,
  LibraryFixture,
  TMDB_ID,
} from '../../test/local-media-fixture.js';
import { MediaType } from '../common/common.dto.js';
import { LocalMediaService } from './local-media.service.js';

describe('ImportService', () => {
  let fixture: LibraryFixture;
  let localMedia: LocalMediaService;
  let library: string;
  let request: LibraryFixture['request'];
  let write: LibraryFixture['write'];
  let indexed: LibraryFixture['indexed'];
  let importEpisode: LibraryFixture['importEpisode'];
  let scanSeries: LibraryFixture['scanSeries'];

  beforeEach(async () => {
    fixture = await createLibraryFixture();
    ({
      localMedia,
      library,
      request,
      write,
      indexed,
      importEpisode,
      scanSeries,
    } = fixture);
  });

  afterEach(() => fixture.close());

  it('imports a file as a managed version of the episode', async () => {
    write('tv/Test Show (2020)/Season 1/Test Show - S01E02.mkv');
    const source = write('downloads/Test.Show.S01E02.1080p.MKV', 'download');

    const destination = await importEpisode(source, [2]);

    expect(path.relative(library, destination)).toBe(
      'Test Show (2020)/Season 1/Test Show - S01E02 - a1b2c3d4.mkv',
    );
    expect(statSync(destination).ino).toBe(statSync(source).ino);

    // The file found next to it stays as it is, and both play as the episode
    await request(() => localMedia.scanTitle(MediaType.Series, TMDB_ID));
    const files = await request(() =>
      localMedia.listEpisodeFiles(TMDB_ID, 1, 2),
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
      'Test Show (2020) [tmdbid-100]/Season 1/Test Show - S01E02-E03 - a1b2c3d4.mkv',
    );
    expect(await scanSeries()).toMatchObject([{ season: 1, episodes: [2, 3] }]);
    expect(await indexed()).toMatchObject([
      { managed: true, infoHash: INFO_HASH, episode: 2, lastEpisode: 3 },
    ]);
  });
});
