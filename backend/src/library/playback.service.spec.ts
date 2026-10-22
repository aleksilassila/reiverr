import { NotFoundException } from '@nestjs/common';
import { mkdirSync, rmSync } from 'node:fs';
import * as path from 'node:path';
import {
  createLibraryFixture,
  LibraryFixture,
  TMDB_ID,
} from '../../test/library-fixture.js';
import { PlaybackService } from './playback.service.js';

describe('PlaybackService', () => {
  let fixture: LibraryFixture;
  let playback: PlaybackService;
  let root: string;
  let jobs: LibraryFixture['jobs'];
  let request: LibraryFixture['request'];
  let write: LibraryFixture['write'];
  let indexed: LibraryFixture['indexed'];
  let scanSeries: LibraryFixture['scanSeries'];
  let saveFoldersAround: LibraryFixture['saveFoldersAround'];

  beforeEach(async () => {
    fixture = await createLibraryFixture();
    ({
      playback,
      root,
      jobs,
      request,
      write,
      indexed,
      scanSeries,
      saveFoldersAround,
    } = fixture);
  });

  afterEach(() => fixture.close());

  it('reads what is indexed and asks for a sync, at once when a file is missing', async () => {
    const file = write('tv/Test Show (2020)/Season 1/Test Show - S01E01.mkv');
    await scanSeries();
    jobs.enqueue.mockClear();

    const soon = Date.now();
    expect(await request(() => playback.listSeriesFiles(TMDB_ID))).toHaveLength(
      1,
    );
    const [, , , later] = jobs.enqueue.mock.calls[0] as unknown[];
    expect((later as { runAt: Date }).runAt.getTime()).toBeGreaterThan(
      soon + 20_000,
    );

    rmSync(file);
    jobs.enqueue.mockClear();
    expect(await request(() => playback.listSeriesFiles(TMDB_ID))).toEqual([]);
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

    expect(await request(() => playback.getStreamPath(file.id))).toBe(video);
    expect(
      await request(() =>
        playback.readSubtitles(file.id, 'Test Show - S01E01.en.srt'),
      ),
    ).toBe('WEBVTT\n\n1\n00:00:01.000 --> 00:00:02.000\nHello\n');

    for (const name of ['Test Show - S01E02.srt', '../../secret.srt']) {
      await expect(
        request(() => playback.readSubtitles(file.id, name)),
      ).rejects.toThrow(NotFoundException);
    }
    await expect(
      request(() => playback.getStreamPath('unknown')),
    ).rejects.toThrow(NotFoundException);

    // A file outside the library folders is not served, whatever the index says
    const other = path.join(root, 'other');
    mkdirSync(other);
    await saveFoldersAround([other]);
    await expect(
      request(() => playback.getStreamPath(file.id)),
    ).rejects.toThrow(NotFoundException);
  });
});
