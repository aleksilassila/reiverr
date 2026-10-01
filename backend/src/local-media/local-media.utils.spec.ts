import {
  folderMatchesTarget,
  isInsideFolder,
  parseEpisodeNumbers,
  parseMediaFolderName,
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
