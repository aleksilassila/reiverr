import {
  episodeFileName,
  folderMatchesTarget,
  isInsideFolder,
  normalizeTitle,
  parseEpisodeNumbers,
  parseMediaFolderName,
  parseSubtitleName,
  seasonFolderName,
  seriesFolderName,
  srtToWebVtt,
} from './local-media.utils.js';

describe('parseMediaFolderName', () => {
  it('parses the title and year', () => {
    expect(parseMediaFolderName('The Movie: Part 2 (2010)')).toEqual({
      title: 'themoviepart2',
      year: 2010,
    });
  });

  it('parses id tags in Jellyfin and Radarr/Sonarr styles', () => {
    expect(parseMediaFolderName('The Movie (2010) [tmdbid-123]')).toEqual({
      title: 'themovie',
      year: 2010,
      tmdbId: '123',
    });
    expect(parseMediaFolderName('The Movie (2010) {imdb-tt0123}')).toEqual({
      title: 'themovie',
      year: 2010,
      imdbId: 'tt0123',
    });
    expect(parseMediaFolderName('Show (2010) {tvdb-456}')).toEqual({
      title: 'show',
      year: 2010,
      tvdbId: '456',
    });
  });

  it('keeps a year that is part of the title', () => {
    expect(parseMediaFolderName('1917 (2019)')).toEqual({
      title: '1917',
      year: 2019,
    });
  });

  it('handles folders without a year', () => {
    expect(parseMediaFolderName('Amélie')).toEqual({ title: 'amelie' });
  });
});

describe('folderMatchesTarget', () => {
  const target = {
    tmdbId: '123',
    imdbId: 'tt0123',
    titles: ['themovie', 'lefilm'],
    year: 2010,
  };

  it('trusts id tags over the title', () => {
    expect(folderMatchesTarget({ title: 'other', tmdbId: '123' }, target)).toBe(
      true,
    );
    expect(
      folderMatchesTarget({ title: 'themovie', tmdbId: '999' }, target),
    ).toBe(false);
    expect(
      folderMatchesTarget({ title: 'other', imdbId: 'tt0123' }, target),
    ).toBe(true);
  });

  it('matches any of the titles with an agreeing year', () => {
    expect(folderMatchesTarget({ title: 'lefilm', year: 2010 }, target)).toBe(
      true,
    );
    expect(folderMatchesTarget({ title: 'themovie' }, target)).toBe(true);
    expect(folderMatchesTarget({ title: 'themovie', year: 1982 }, target)).toBe(
      false,
    );
    expect(folderMatchesTarget({ title: 'another', year: 2010 }, target)).toBe(
      false,
    );
  });

  it('never matches an empty title', () => {
    expect(
      folderMatchesTarget({ title: '' }, { ...target, titles: [''] }),
    ).toBe(false);
  });
});

describe('parseEpisodeNumbers', () => {
  it('parses single episodes', () => {
    expect(
      parseEpisodeNumbers('Show (2010) - S01E02 - Title [WEBDL-1080p].mkv'),
    ).toEqual({ season: 1, episodes: [2] });
    expect(parseEpisodeNumbers('show.s02e10.720p.mkv')).toEqual({
      season: 2,
      episodes: [10],
    });
    expect(parseEpisodeNumbers('Show - 1x02.mkv')).toEqual({
      season: 1,
      episodes: [2],
    });
    expect(parseEpisodeNumbers('Show - S00E01 - Special.mkv')).toEqual({
      season: 0,
      episodes: [1],
    });
  });

  it('parses multi-episode files', () => {
    expect(parseEpisodeNumbers('Show - S01E01-02 - Title.mkv')).toEqual({
      season: 1,
      episodes: [1, 2],
    });
    expect(parseEpisodeNumbers('Show - S01E01-E03.mkv')).toEqual({
      season: 1,
      episodes: [1, 2, 3],
    });
    expect(parseEpisodeNumbers('Show - S01E01E02.mkv')).toEqual({
      season: 1,
      episodes: [1, 2],
    });
    expect(parseEpisodeNumbers('Show - S01E01-S01E02.mkv')).toEqual({
      season: 1,
      episodes: [1, 2],
    });
  });

  it('does not read qualities or resolutions as episodes', () => {
    expect(parseEpisodeNumbers('Show - S01E01-720p.mkv')).toEqual({
      season: 1,
      episodes: [1],
    });
    expect(parseEpisodeNumbers('Show - S01E01 - Episode.mkv')).toEqual({
      season: 1,
      episodes: [1],
    });
    expect(parseEpisodeNumbers('Movie (2010) 1920x1080.mkv')).toBeUndefined();
    expect(parseEpisodeNumbers('Movie (2010).mkv')).toBeUndefined();
  });
});

describe('isInsideFolder', () => {
  it('only accepts paths below the folder', () => {
    expect(isInsideFolder('/media/movies/a/b.mkv', '/media/movies')).toBe(true);
    expect(isInsideFolder('/media/movies', '/media/movies')).toBe(false);
    expect(isInsideFolder('/media/movies/../x.mkv', '/media/movies')).toBe(
      false,
    );
    expect(isInsideFolder('/media/moviesx/a.mkv', '/media/movies')).toBe(false);
  });
});

describe('import naming', () => {
  it('names a series folder that the folder matching reads back', () => {
    const name = seriesFolderName('Title: Part 2?', 2020, '123');

    expect(name).toBe('Title Part 2 (2020) [tmdbid-123]');
    expect(
      folderMatchesTarget(parseMediaFolderName(name), {
        tmdbId: '123',
        titles: [normalizeTitle('Something else')],
      }),
    ).toBe(true);
    expect(seriesFolderName('Title', undefined, '123')).toBe(
      'Title [tmdbid-123]',
    );
  });

  it('names episode files that the episode parsing reads back', () => {
    const single = episodeFileName('Show: Name', 1, [2], 'a1b2c3d4', '.MKV');
    // A label that starts like an episode number must not be read as one
    const double = episodeFileName('Show', 12, [3, 4], 'e1234567', '.mp4');

    expect(seasonFolderName(1)).toBe('Season 01');
    expect(single).toBe('Show Name - S01E02 - a1b2c3d4.mkv');
    expect(double).toBe('Show - S12E03-E04 - e1234567.mp4');
    expect(parseEpisodeNumbers(single)).toEqual({ season: 1, episodes: [2] });
    expect(parseEpisodeNumbers(double)).toEqual({
      season: 12,
      episodes: [3, 4],
    });
  });
});

describe('parseSubtitleName', () => {
  it('reads the language and tags of a sidecar subtitle', () => {
    expect(parseSubtitleName('Show - S01E02.srt', 'Show - S01E02.mkv')).toEqual(
      {
        lang: undefined,
        label: 'Subtitles',
      },
    );
    expect(
      parseSubtitleName('Show - S01E02.en.forced.srt', 'Show - S01E02.mkv'),
    ).toEqual({
      lang: 'en',
      label: 'en forced',
    });
    expect(
      parseSubtitleName('Show - S01E02.fin.vtt', 'Show - S01E02.mp4'),
    ).toEqual({
      lang: 'fin',
      label: 'fin',
    });
  });

  it('rejects subtitles of other videos', () => {
    expect(
      parseSubtitleName('Show - S01E03.srt', 'Show - S01E02.mkv'),
    ).toBeUndefined();
    expect(
      parseSubtitleName('Show - S01E02x.srt', 'Show - S01E02.mkv'),
    ).toBeUndefined();
  });
});

describe('srtToWebVtt', () => {
  it('converts timestamps and strips styling tags', () => {
    const srt =
      '﻿1\r\n00:00:01,000 --> 00:00:02,500\r\n{\\an8}Hello <i>there</i>\r\n\r\n2\r\n00:00:03,000 --> 00:00:04,000\r\nBye\r\n';

    expect(srtToWebVtt(srt)).toBe(
      'WEBVTT\n\n1\n00:00:01.000 --> 00:00:02.500\nHello <i>there</i>\n\n2\n00:00:03.000 --> 00:00:04.000\nBye\n',
    );
  });
});
