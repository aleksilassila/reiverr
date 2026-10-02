import { parseEpisodeNumbers } from '../local-media/local-media.utils.js';

export type ReleaseKind = 'episode' | 'season-pack' | 'other';

export interface ParsedReleaseTitle {
  kind: ReleaseKind;
  seasons: number[];
  episodes: number[];
}

// The patterns below follow Sonarr's release parser (NzbDrone.Core/Parser/Parser.cs):
// quality and codec tokens are removed first so their digits are not read as
// season or episode numbers, an episode number makes the release an episode
// release, and a season marker without one makes it a season pack.
const QUALITY_PATTERN =
  /(?:480|540|576|720|1080|2160)[ip]|[xh][\W_]?26[45]|(?:ddp?|aac|ac3|dts|eac3)[\W_]?\d[\W_]\d|848x480|1280x720|1920x1080|3840x2160|(?:8|10)[\W_]?bit/gi;

const SEASON_MARKER = String.raw`(?:s|(?:seasons?|saison|series|stagione)[-_. ]?)`;

// "S01", "Season 1", "Season.01"; not "S01 05" or "S2019"
const SEASON_PATTERN = new RegExp(
  String.raw`(?<![a-z0-9])${SEASON_MARKER}(\d{1,2})(?![a-z0-9]|[-_. ]\d{1,3}(?!\d))`,
  'gi',
);
// "S01-S03", "S01-03", "Season 1-3", "Seasons 1 to 3"
const SEASON_RANGE_PATTERN = new RegExp(
  String.raw`(?<![a-z0-9])${SEASON_MARKER}(\d{1,2})[_. ]{0,2}(?:-|to|thru)[_. ]{0,2}${SEASON_MARKER}?(\d{1,2})(?![a-z0-9])`,
  'i',
);
// "S01 Part 2", "S01 Vol 1"
const PARTIAL_SEASON_PATTERN =
  /(?<![a-z0-9])s\d{1,2}[\W_]+(?:part|vol(?:ume)?)[\W_]?\d{1,2}(?![a-z0-9])/i;
// "S01 EXTRAS", "S01 SUBPACK"
const SEASON_EXTRAS_PATTERN = new RegExp(
  String.raw`(?<![a-z0-9])${SEASON_MARKER}\d{1,2}[-_. ]+(?:extras|subpack)(?![a-z0-9])`,
  'i',
);

export function parseReleaseTitle(title: string): ParsedReleaseTitle {
  const simpleTitle = title.replace(QUALITY_PATTERN, ' ');

  const episode = parseEpisodeNumbers(simpleTitle);
  if (episode) {
    return {
      kind: 'episode',
      seasons: [episode.season],
      episodes: episode.episodes,
    };
  }

  const range = SEASON_RANGE_PATTERN.exec(simpleTitle);
  const numbers =
    range && Number(range[2]) > Number(range[1])
      ? [Number(range[1]), Number(range[2])]
      : [...simpleTitle.matchAll(SEASON_PATTERN)].map((m) => Number(m[1]));

  if (!numbers.length) return { kind: 'other', seasons: [], episodes: [] };

  const seasons: number[] = [];
  for (let s = Math.min(...numbers); s <= Math.max(...numbers); s++) {
    seasons.push(s);
  }

  const isPack =
    !PARTIAL_SEASON_PATTERN.test(simpleTitle) &&
    !SEASON_EXTRAS_PATTERN.test(simpleTitle);

  return { kind: isPack ? 'season-pack' : 'other', seasons, episodes: [] };
}
