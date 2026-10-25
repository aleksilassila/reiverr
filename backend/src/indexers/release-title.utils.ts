import {
  normalizeTitle,
  parseEpisodeNumbers,
} from '../library/library.utils.js';

export type ReleaseKind = 'episode' | 'season-pack' | 'other';

export interface ParsedReleaseTitle {
  kind: ReleaseKind;
  seasons: number[];
  episodes: number[];
}

/**
 * What the title of a movie release says of its movie
 * (`parseMovieReleaseTitle`)
 *
 * @example
 * // "The.Matrix.1999.REMASTERED.1080p.BluRay.x264-GRP"
 * { title: 'thematrix', year: 1999 }
 */
export interface ParsedMovieReleaseTitle {
  /** The name as a comparison key, as `normalizeTitle` reads the title of the movie */
  title: string;
  year?: number;
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

// A year as a token of its own: "Name.2019.1080p", "Name (2019)"; not part of a longer number
const YEAR_PATTERN = /(?<![a-z0-9])((?:19|20)\d{2})(?![a-z0-9])/gi;
// Where the source and codec tokens begin, which end the name of a release without a year
const SOURCE_PATTERN =
  /[\W_](?:blu-?ray|bd-?rip|br-?rip|web-?dl|web-?rip|web|hdtv|dvd-?rip|dvd|hd-?rip|remux|uhd|hdr(?:10)?|hevc|avc|aac|ac3|dts|atmos|truehd|multi|proper|repack|internal|complete)(?![a-z0-9])/i;
// Editions, which the name of a movie does not have (Radarr's edition tokens)
const EDITION_PATTERN =
  /[\W_](?:directors?[\W_]?cut|extended(?:[\W_](?:cut|edition))?|unrated|uncut|theatrical(?:[\W_]cut)?|remastered|imax|final[\W_]cut|ultimate[\W_](?:cut|edition)|special[\W_]edition|collectors?[\W_]edition|anniversary[\W_]edition|limited|criterion)(?![a-z0-9])/gi;
// "[Group] Name 2019"
const GROUP_PREFIX_PATTERN = /^\s*\[[^\]]*\]\s*/;

/**
 * The movie of a release, after Radarr's parser: the name is what comes
 * before the last year, or before the first source token when there is no
 * year, without the editions. A year that nothing comes before is part of
 * the name ("2001.A.Space.Odyssey.1968").
 */
export function parseMovieReleaseTitle(title: string): ParsedMovieReleaseTitle {
  const simpleTitle = title
    .replace(GROUP_PREFIX_PATTERN, '')
    .replace(QUALITY_PATTERN, ' ');
  const years = [...simpleTitle.matchAll(YEAR_PATTERN)].filter((match) =>
    /[a-z0-9]/i.test(simpleTitle.slice(0, match.index)),
  );
  const year = years[years.length - 1];

  let name = year ? simpleTitle.slice(0, year.index) : simpleTitle;
  if (!year) {
    const source = SOURCE_PATTERN.exec(name);
    if (source) name = name.slice(0, source.index);
  }
  name = name.replace(EDITION_PATTERN, ' ');

  return {
    title: normalizeTitle(name),
    ...(year && { year: Number(year[1]) }),
  };
}

/**
 * Whether a release is of a movie, by its title: the name is one of the
 * titles of the movie (normalized) and the year, when the release has one,
 * is within one of the movie's; or the name with the year is the title
 * ("Blade Runner 2049"). Not an episode or a season pack of a series of
 * the same name.
 */
export function isReleaseOfMovie(
  releaseTitle: string,
  movie: { titles: string[]; year?: number },
): boolean {
  if (parseReleaseTitle(releaseTitle).kind !== 'other') return false;

  const { title, year } = parseMovieReleaseTitle(releaseTitle);
  if (year !== undefined && movie.titles.includes(`${title}${year}`)) {
    return true;
  }
  if (!movie.titles.includes(title)) return false;

  return (
    year === undefined ||
    movie.year === undefined ||
    Math.abs(year - movie.year) <= 1
  );
}
