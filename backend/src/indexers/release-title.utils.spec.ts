import {
  isReleaseOfMovie,
  parseMovieReleaseTitle,
  parseReleaseTitle,
} from './release-title.utils.js';

describe('parseReleaseTitle', () => {
  it.each([
    ['Show.Name.S01E02.1080p.WEB.h264-GRP', [1], [2]],
    ['Show Name S01E02E03 720p HDTV x264', [1], [2, 3]],
    ['Show.Name.S02E05-E07.2160p.WEB-DL.DDP5.1', [2], [5, 6, 7]],
    ['Show Name 1x02 HDTV', [1], [2]],
    ['Show.Name.2019.S10E01.1080p.BluRay.x265-GRP', [10], [1]],
  ])('reads %s as an episode release', (title, seasons, episodes) => {
    expect(parseReleaseTitle(title)).toEqual({
      kind: 'episode',
      seasons,
      episodes,
    });
  });

  it.each([
    ['Show.Name.S01.1080p.BluRay.x264-GRP', [1]],
    ['Show.Name.S01.2160p.WEB-DL.DDP5.1.H.265-GRP', [1]],
    ['Show Name Season 2 Complete 720p', [2]],
    ['Show.Name.Season.03.1080p.WEB', [3]],
    ['Show.Name.S01.2019.1080p.WEB', [1]],
    ['Show.Name.Saison.1.FRENCH.1080p', [1]],
    ['Show.Name.S01-S03.1080p.BluRay', [1, 2, 3]],
    ['Show Name Season 1-4 Complete', [1, 2, 3, 4]],
    ['Show.Name.S01.S02.720p.WEB', [1, 2]],
    ['[Group] Show Name (Season 1) [1080p]', [1]],
  ])('reads %s as a season pack', (title, seasons) => {
    expect(parseReleaseTitle(title)).toEqual({
      kind: 'season-pack',
      seasons,
      episodes: [],
    });
  });

  it.each([
    ['Show.Name.S01.Part.2.1080p.WEB'],
    ['Show Name S02 Vol 1 720p'],
    ['Show.Name.S01.EXTRAS.1080p.BluRay'],
    ['Show.Name.S01.SUBPACK'],
    ['Show.Name.Complete.Series.1080p.BluRay'],
    ['Show.Name.2019.1080p.WEB.x264'],
    ["It's 5 O'Clock Somewhere 1080p"],
  ])('does not read %s as an episode or a season pack', (title) => {
    expect(parseReleaseTitle(title).kind).toBe('other');
  });
});

describe('parseMovieReleaseTitle', () => {
  it.each([
    ['The.Matrix.1999.1080p.BluRay.x264-GRP', 'thematrix', 1999],
    ['The Matrix (1999) [1080p] [YTS.MX]', 'thematrix', 1999],
    ['The.Matrix.1999.REMASTERED.2160p.UHD.BluRay.x265', 'thematrix', 1999],
    [
      'Blade.Runner.2049.2017.1080p.WEB-DL.DDP5.1.H.264',
      'bladerunner2049',
      2017,
    ],
    ['2001.A.Space.Odyssey.1968.1080p.BluRay', '2001aspaceodyssey', 1968],
    ['Apocalypse.Now.1979.Final.Cut.1080p.BluRay', 'apocalypsenow', 1979],
    ["Ocean's Eleven 2001 720p BluRay", 'oceanseleven', 2001],
    ['[Group] Some Movie 2019 1080p', 'somemovie', 2019],
    ['Some.Movie.1080p.BluRay.x264-GRP', 'somemovie', undefined],
    ['Some Movie Extended Edition WEB-DL', 'somemovie', undefined],
  ])('reads %s as the movie', (title, name, year) => {
    expect(parseMovieReleaseTitle(title)).toEqual({
      title: name,
      ...(year !== undefined && { year }),
    });
  });
});

describe('isReleaseOfMovie', () => {
  const matrix = { titles: ['thematrix'], year: 1999 };

  it.each([
    ['The.Matrix.1999.1080p.BluRay.x264-GRP', matrix],
    ['The Matrix 2000 720p', matrix],
    ['The.Matrix.1080p.BluRay', matrix],
    [
      'Blade.Runner.2049.1080p.BluRay',
      { titles: ['bladerunner2049'], year: 2017 },
    ],
    [
      'La.Casa.De.Papel.2017.1080p',
      { titles: ['moneyheist', 'lacasadepapel'] },
    ],
  ])('takes %s for the movie', (title, movie) => {
    expect(isReleaseOfMovie(title, movie)).toBe(true);
  });

  it.each([
    ['The.Matrix.Reloaded.2003.1080p.BluRay', matrix],
    ['The.Matrix.2019.1080p.WEB', matrix],
    ['The.Matrix.S01E01.1080p.WEB', matrix],
    ['The.Matrix.S01.1080p.WEB', matrix],
    ['Some.Other.Movie.1999.1080p', matrix],
  ])('does not take %s for the movie', (title, movie) => {
    expect(isReleaseOfMovie(title, movie)).toBe(false);
  });
});
