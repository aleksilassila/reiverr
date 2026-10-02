import { parseReleaseTitle } from './release-title.utils.js';

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
