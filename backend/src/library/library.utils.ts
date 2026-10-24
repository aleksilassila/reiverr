import * as path from 'path';
import { MediaType } from '../common/common.dto.js';
import type { LibraryFolderDto } from './library.dto.js';
import { MediaFile } from './media-file.entity.js';

const VIDEO_EXTENSIONS = new Set([
  '.mkv',
  '.mp4',
  '.m4v',
  '.webm',
  '.avi',
  '.mov',
  '.ts',
  '.m2ts',
  '.wmv',
  '.flv',
  '.mpg',
  '.mpeg',
]);

const SUBTITLE_EXTENSIONS = new Set(['.srt', '.vtt']);

// "[tmdbid-123]" (Jellyfin), "{tmdb-123}" (Radarr/Sonarr), imdb and tvdb likewise
const ID_TAG_PATTERN = /[[{](tmdb|imdb|tvdb)(?:id)?[-=](tt\d+|\d+)[\]}]/gi;
const YEAR_PATTERN = /\((\d{4})\)/g;

// "S01E02", "S01E01E02", "S01E01-E02", "S01E01-S01E02" and "S01E01-02" (Sonarr multi-episode styles)
const SEASON_EPISODE_PATTERN =
  /(?<![a-z0-9])s(\d{1,2})[ ._-]?e(\d{1,3})(?:(?:[ ._-]*(?:s\d{1,2})?[ ._-]?e|-)(\d{1,3}))?(?![a-z0-9])/i;
// "1x02"
const SEASON_X_EPISODE_PATTERN =
  /(?<![a-z0-9])(\d{1,2})x(\d{1,3})(?![a-z0-9])/i;

export interface ParsedMediaFolderName {
  /** The name without its tags and year, as it is written */
  name: string;
  /** The name as a comparison key */
  title: string;
  year?: number;
  tmdbId?: string;
  imdbId?: string;
  tvdbId?: string;
}

export interface TitleMatch {
  titles: string[];
  year?: number;
  tmdbId: string;
  imdbId?: string;
  tvdbId?: string;
}

export interface ParsedEpisodeNumbers {
  season: number;
  episodes: number[];
}

export function isVideoFile(fileName: string): boolean {
  return VIDEO_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

export function isSubtitleFile(fileName: string): boolean {
  return SUBTITLE_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

export interface ParsedSubtitleName {
  lang?: string;
  label: string;
}

/**
 * Reads the tags of a sidecar subtitle, "Show - S01E02.en.forced.srt" next to
 * "Show - S01E02.mkv", or undefined when the file belongs to another video.
 */
export function parseSubtitleName(
  subtitleName: string,
  videoName: string,
): ParsedSubtitleName | undefined {
  const base = videoName.slice(0, -path.extname(videoName).length);
  const subtitleBase = subtitleName.slice(
    0,
    -path.extname(subtitleName).length,
  );
  if (subtitleBase !== base && !subtitleBase.startsWith(`${base}.`))
    return undefined;

  const tags = subtitleBase
    .slice(base.length + 1)
    .split('.')
    .filter(Boolean);
  const lang = tags.find((tag) => /^[a-z]{2,3}$/i.test(tag))?.toLowerCase();

  return { lang, label: tags.join(' ') || 'Subtitles' };
}

/** Converts SubRip text to WebVTT: a header, dots in the timestamps and no styling tags */
export function srtToWebVtt(srt: string): string {
  const body = srt
    .replace(/^\uFEFF/, '')
    .replace(/\r/g, '')
    .trim()
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')
    .replace(/\{\\[^}]*\}/g, '');

  return `WEBVTT\n\n${body}\n`;
}

/**
 * Reduces a title to a comparison key so that punctuation, casing and characters
 * Radarr and Sonarr strip from folder names ("Title: Part 2" -> "Title Part 2") do not matter.
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '');
}

export function yearOf(date?: string): number | undefined {
  const year = date ? Number(date.slice(0, 4)) : NaN;
  return Number.isNaN(year) ? undefined : year;
}

export function parseMediaFolderName(name: string): ParsedMediaFolderName {
  const parsed: ParsedMediaFolderName = { name: '', title: '' };

  let rest = name.replace(ID_TAG_PATTERN, (_, provider: string, id: string) => {
    if (provider.toLowerCase() === 'tmdb') parsed.tmdbId = id;
    else if (provider.toLowerCase() === 'imdb')
      parsed.imdbId = id.toLowerCase();
    else parsed.tvdbId = id;
    return '';
  });

  const years = [...rest.matchAll(YEAR_PATTERN)];
  const year = years[years.length - 1];
  if (year) {
    parsed.year = Number(year[1]);
    rest = rest.slice(0, year.index) + rest.slice(year.index + year[0].length);
  }

  parsed.name = rest.replace(/\s+/g, ' ').trim();
  parsed.title = normalizeTitle(rest);

  return parsed;
}

/**
 * An id tag in the folder name is authoritative; without one the normalized
 * title has to match and the years, when both are known, have to agree.
 */
export function folderMatchesTitle(
  folder: Omit<ParsedMediaFolderName, 'name'>,
  match: TitleMatch,
): boolean {
  if (folder.tmdbId) return folder.tmdbId === match.tmdbId;
  if (folder.imdbId && match.imdbId)
    return folder.imdbId === match.imdbId.toLowerCase();
  if (folder.tvdbId && match.tvdbId) return folder.tvdbId === match.tvdbId;

  if (!folder.title || !match.titles.includes(folder.title)) return false;

  return (
    folder.year === undefined ||
    match.year === undefined ||
    folder.year === match.year
  );
}

export function parseEpisodeNumbers(
  fileName: string,
): ParsedEpisodeNumbers | undefined {
  const match =
    SEASON_EPISODE_PATTERN.exec(fileName) ??
    SEASON_X_EPISODE_PATTERN.exec(fileName);

  if (!match) return undefined;

  const season = Number(match[1]);
  const first = Number(match[2]);
  const last = match[3] !== undefined ? Number(match[3]) : first;

  const episodes: number[] = [];
  for (let episode = first; episode <= Math.max(first, last); episode++) {
    episodes.push(episode);
  }

  return { season, episodes };
}

/** Removes the characters that are not allowed in file names on common filesystems */
export function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[. ]+$/, '')
    .trim();
}

/** "Name (Year) [tmdbid-123]", the Jellyfin naming that the folder matching reads back */
export function seriesFolderName(
  name: string,
  year: number | undefined,
  tmdbId: string,
): string {
  return [sanitizeFileName(name), year && `(${year})`, `[tmdbid-${tmdbId}]`]
    .filter(Boolean)
    .join(' ');
}

export function seasonFolderName(season: number): string {
  return `Season ${season}`;
}
/**
 * "Name - S01E02 - label.mkv", or "Name - S01E02-E03 - label.mkv" for a file
 * with several episodes. The label tells the versions of an episode apart,
 * in the naming Jellyfin reads as versions.
 */
export function episodeFileName(
  name: string,
  season: number,
  episodes: number[],
  label: string,
  extension: string,
): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const first = Math.min(...episodes);
  const last = Math.max(...episodes);
  const numbering =
    `S${pad(season)}E${pad(first)}` + (last > first ? `-E${pad(last)}` : '');

  return `${sanitizeFileName(name)} - ${numbering} - ${label}${extension.toLowerCase()}`;
}

/**
 * The paths of the folders of a type, the primary first: the order their
 * title folders and the versions of an episode are looked at in
 */
export function libraryFolderPaths(
  folders: Record<string, LibraryFolderDto>,
): string[] {
  const paths = Object.keys(folders);

  return [
    ...paths.filter((folder) => folders[folder].primary),
    ...paths.filter((folder) => !folders[folder].primary),
  ];
}

/** The folder of a type that new titles are imported into */
export function primaryLibraryFolder(
  folders: Record<string, LibraryFolderDto>,
): string | undefined {
  return Object.keys(folders).find((folder) => folders[folder].primary);
}

export function isInsideFolder(filePath: string, folder: string): boolean {
  const relative = path.relative(folder, filePath);
  return (
    relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative)
  );
}

/** "EACCES: permission denied", without the system call and the path */
export const describeError = (error: Error) => error.message.split(',')[0];

/** A path in a library folder as the API gives it, with / between the names */
export const relativePath = (folder: string, entryPath: string) =>
  path.relative(folder, entryPath).split(path.sep).join('/');

/** Whether a file of a series is of an episode: of its title and season, and the episode is among the file's */
export function coversEpisode(
  file: Pick<
    MediaFile,
    'mediaType' | 'tmdbId' | 'season' | 'episode' | 'lastEpisode'
  >,
  episode: { tmdbId: string; season: number; episode: number },
): boolean {
  return (
    file.mediaType === MediaType.Series &&
    file.tmdbId === episode.tmdbId &&
    file.season === episode.season &&
    file.episode <= episode.episode &&
    episode.episode <= file.lastEpisode
  );
}
