import { EntityManager } from '@mikro-orm/sqlite';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Dirent, promises as fs } from 'fs';
import { randomUUID } from 'node:crypto';
import * as path from 'path';
import { MediaType } from '../common/common.dto.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { SettingsService } from '../settings/settings.service.js';
import {
  LocalEpisodeFileDto,
  LocalMediaFileDto,
  LocalMediaSettingsDto,
  LocalSubtitleFileDto,
} from './local-media.dto.js';
import { LOCAL_MEDIA_VERSION_GONE } from './local-media.events.js';
import {
  episodeFileName,
  folderMatchesTarget,
  isInsideFolder,
  isSubtitleFile,
  isVideoFile,
  MediaMatchTarget,
  normalizeTitle,
  parseEpisodeNumbers,
  parseMediaFolderName,
  parseSubtitleName,
  seasonFolderName,
  seriesFolderName,
  srtToWebVtt,
  yearOf,
} from './local-media.utils.js';
import { MediaFile } from './media-file.entity.js';

const SETTINGS_KEY = 'local-media';

const DEFAULT_SETTINGS: LocalMediaSettingsDto = {
  movieFolders: [],
  seriesFolders: [],
};

// Title folder -> season folder -> file is the deepest layout Radarr and Sonarr produce
const MAX_DEPTH = 3;

// The length of the version label in the names of imported files
const VERSION_LABEL_LENGTH = 8;

// SQLite limits the number of values in one statement
const INDEX_BATCH_SIZE = 500;

interface FoundFile {
  path: string;
  name: string;
  size: number;
  modifiedAt: Date;
  subtitles: LocalSubtitleFileDto[];
}

/** What a file is, as far as its name tells */
type FileTarget = Pick<MediaFile, 'season' | 'episode' | 'lastEpisode'>;

const INDEXED_FIELDS = [
  'mediaType',
  'tmdbId',
  'season',
  'episode',
  'lastEpisode',
  'size',
  'modifiedAt',
] as const;

@Injectable()
export class LocalMediaService {
  constructor(
    private readonly em: EntityManager,
    private readonly settingsService: SettingsService,
    private readonly metadataService: MetadataService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  getSettings(): Promise<LocalMediaSettingsDto> {
    return this.settingsService.getOrCreateValue(
      SETTINGS_KEY,
      DEFAULT_SETTINGS,
    );
  }

  async updateSettings(
    settings: LocalMediaSettingsDto,
  ): Promise<LocalMediaSettingsDto> {
    const value: LocalMediaSettingsDto = {
      movieFolders: await this.resolveFolders(settings.movieFolders),
      seriesFolders: await this.resolveFolders(settings.seriesFolders),
    };

    return this.settingsService.saveValue(SETTINGS_KEY, value);
  }

  async getMovieFiles(tmdbId: string): Promise<LocalMediaFileDto[]> {
    const metadata = await this.metadataService.getMovieByTmdbId(tmdbId);
    if (!metadata) throw new NotFoundException('Movie not found');

    const movie = metadata.tmdbMovie;
    const target: MediaMatchTarget = {
      tmdbId,
      imdbId: movie.imdb_id ?? movie.external_ids?.imdb_id,
      titles: [movie.title, movie.original_title]
        .filter(Boolean)
        .map(normalizeTitle),
      year: yearOf(movie.release_date),
    };

    const { movieFolders } = await this.getSettings();
    const found = (await this.findFiles(movieFolders, target)).map((file) => ({
      ...file,
      season: 0,
      episode: 0,
      lastEpisode: 0,
    }));
    const ids = await this.indexFiles(MediaType.Movie, tmdbId, found);

    return found.map((file) => toFileDto(ids.get(file.path), file));
  }

  async getSeriesFiles(tmdbId: string): Promise<LocalEpisodeFileDto[]> {
    const { target } = await this.getSeriesTarget(tmdbId);
    const { seriesFolders } = await this.getSettings();

    const found = (await this.findFiles(seriesFolders, target)).flatMap(
      (file) => {
        const numbers = parseEpisodeNumbers(file.name);

        return numbers
          ? [{ ...file, ...numbers, ...toFileTarget(numbers) }]
          : [];
      },
    );
    const ids = await this.indexFiles(MediaType.Series, tmdbId, found);

    return found.map((file) => ({
      ...toFileDto(ids.get(file.path), file),
      season: file.season,
      episodes: file.episodes,
    }));
  }

  async getEpisodeFiles(
    tmdbId: string,
    season: number,
    episode: number,
  ): Promise<LocalEpisodeFileDto[]> {
    const files = await this.getSeriesFiles(tmdbId);

    return files.filter(
      (file) => file.season === season && file.episodes.includes(episode),
    );
  }

  /**
   * Adds a video file to the library as the given episodes of a series, as
   * the version of the torrent it comes from. The file is hard linked so it
   * takes no extra space, or copied when the source is on another filesystem.
   */
  async importEpisodeFile(options: {
    tmdbId: string;
    season: number;
    episodes: number[];
    sourcePath: string;
    infoHash: string;
  }): Promise<string> {
    const { tmdbId, season, episodes, sourcePath, infoHash } = options;
    const { name, target } = await this.getSeriesTarget(tmdbId);
    const { seriesFolders } = await this.getSettings();
    if (!seriesFolders.length) {
      throw new Error('No series folder is configured');
    }

    const [titleFolder] = await this.findTitleFolders(seriesFolders, target);
    const seasonFolder = path.join(
      titleFolder ??
        path.join(
          seriesFolders[0],
          seriesFolderName(name, target.year, tmdbId),
        ),
      seasonFolderName(season),
    );
    const destination = path.join(
      seasonFolder,
      episodeFileName(
        name,
        season,
        episodes,
        infoHash.slice(0, VERSION_LABEL_LENGTH),
        path.extname(sourcePath),
      ),
    );

    await fs.mkdir(seasonFolder, { recursive: true });
    await fs.link(sourcePath, destination).catch(async (error) => {
      // This file of the torrent was imported before
      if (error.code === 'EEXIST') return;

      // A file that is still being copied must not look like an episode
      const partial = `${destination}.partial`;
      await fs.copyFile(sourcePath, partial);
      await fs.rename(partial, destination);
    });

    const stats = await fs.stat(destination);
    await this.em
      .createQueryBuilder(MediaFile)
      .insert({
        id: randomUUID(),
        path: destination,
        mediaType: MediaType.Series,
        tmdbId,
        ...toFileTarget({ season, episodes }),
        size: stats.size,
        modifiedAt: stats.mtime,
        infoHash,
        managed: true,
        createdAt: new Date(),
      })
      // A lookup of the series can have indexed the file already
      .onConflict('path')
      .merge([...INDEXED_FIELDS, 'infoHash', 'managed'])
      .execute();

    return destination;
  }

  /** The indexed files of a title, as they were at its last lookup */
  findIndexedFiles(mediaType: MediaType, tmdbId: string): Promise<MediaFile[]> {
    return this.em.find(
      MediaFile,
      { mediaType, tmdbId },
      { disableIdentityMap: true },
    );
  }

  /** The indexed files that were imported from the given torrents */
  findVersions(infoHashes: string[]): Promise<MediaFile[]> {
    return this.em.find(
      MediaFile,
      { infoHash: { $in: infoHashes } },
      { disableIdentityMap: true },
    );
  }

  /** The path of an indexed video file */
  async resolveFilePath(id: string): Promise<string> {
    const file = await this.findFile(id);
    await this.assertInLibrary(file.path);

    return file.path;
  }

  /**
   * A subtitle file next to an indexed video, as WebVTT, which is what
   * browsers play
   */
  async readSubtitles(id: string, fileName: string): Promise<string> {
    const file = await this.findFile(id);

    const belongsToVideo =
      fileName === path.basename(fileName) &&
      isSubtitleFile(fileName) &&
      !!parseSubtitleName(fileName, path.basename(file.path));
    if (!belongsToVideo) throw new NotFoundException('File not found');

    const subtitlePath = path.join(path.dirname(file.path), fileName);
    await this.assertInLibrary(subtitlePath);
    const text = await fs.readFile(subtitlePath, 'utf8');

    return path.extname(subtitlePath).toLowerCase() === '.srt'
      ? srtToWebVtt(text)
      : text;
  }

  private async findFile(id: string): Promise<MediaFile> {
    const file = await this.em.findOne(
      MediaFile,
      { id },
      { disableIdentityMap: true },
    );
    if (!file) throw new NotFoundException('File not found');

    return file;
  }

  /** The library folders can have changed since the file was indexed */
  private async assertInLibrary(filePath: string): Promise<void> {
    const { movieFolders, seriesFolders } = await this.getSettings();

    const isInLibrary = [...movieFolders, ...seriesFolders].some((folder) =>
      isInsideFolder(filePath, folder),
    );
    const stats = isInLibrary
      ? await fs.stat(filePath).catch(() => undefined)
      : undefined;

    if (!stats?.isFile()) throw new NotFoundException('File not found');
  }

  /**
   * Brings the indexed files of a title in line with what was found on disk
   * and returns their ids by path. Files that are new to the index are not
   * managed, files that are gone are forgotten.
   */
  private async indexFiles(
    mediaType: MediaType,
    tmdbId: string,
    found: (FoundFile & FileTarget)[],
  ): Promise<Map<string, string>> {
    const indexed = await this.em.find(
      MediaFile,
      { mediaType, tmdbId },
      { disableIdentityMap: true },
    );
    const indexedByPath = new Map(indexed.map((file) => [file.path, file]));
    const foundPaths = new Set(found.map((file) => file.path));

    const gone = indexed.filter((file) => !foundPaths.has(file.path));
    const changed = found.filter((file) => {
      const current = indexedByPath.get(file.path);

      return (
        !current ||
        current.size !== file.size ||
        current.modifiedAt.getTime() !== file.modifiedAt.getTime() ||
        current.season !== file.season ||
        current.episode !== file.episode ||
        current.lastEpisode !== file.lastEpisode
      );
    });

    if (gone.length) {
      await this.em.nativeDelete(MediaFile, {
        id: { $in: gone.map((file) => file.id) },
      });
    }
    if (gone.some((file) => file.infoHash)) {
      await this.eventEmitter.emitAsync(LOCAL_MEDIA_VERSION_GONE);
    }
    if (!changed.length) {
      return new Map(indexed.map((file) => [file.path, file.id]));
    }

    for (let i = 0; i < changed.length; i += INDEX_BATCH_SIZE) {
      await this.em
        .createQueryBuilder(MediaFile)
        .insert(
          changed.slice(i, i + INDEX_BATCH_SIZE).map((file) => ({
            id: randomUUID(),
            path: file.path,
            mediaType,
            tmdbId,
            season: file.season,
            episode: file.episode,
            lastEpisode: file.lastEpisode,
            size: file.size,
            modifiedAt: file.modifiedAt,
            managed: false,
            createdAt: new Date(),
          })),
        )
        // Keeps the id and where the file came from
        .onConflict('path')
        .merge([...INDEXED_FIELDS])
        .execute();
    }

    const current = await this.em.find(
      MediaFile,
      { path: { $in: [...foundPaths] } },
      { fields: ['id', 'path'], disableIdentityMap: true },
    );

    return new Map(current.map((file) => [file.path, file.id]));
  }

  private async getSeriesTarget(
    tmdbId: string,
  ): Promise<{ name: string; target: MediaMatchTarget }> {
    const metadata = await this.metadataService.getSeriesByTmdbId(tmdbId);
    if (!metadata) throw new NotFoundException('Series not found');

    const series = metadata.tmdbSeries;

    return {
      name: series.name,
      target: {
        tmdbId,
        imdbId: series.external_ids?.imdb_id,
        tvdbId: series.external_ids?.tvdb_id
          ? String(series.external_ids.tvdb_id)
          : undefined,
        titles: [series.name, series.original_name]
          .filter(Boolean)
          .map(normalizeTitle),
        year: yearOf(series.first_air_date),
      },
    };
  }

  private async resolveFolders(folders: unknown): Promise<string[]> {
    if (
      !Array.isArray(folders) ||
      folders.some((folder) => typeof folder !== 'string' || !folder)
    ) {
      throw new BadRequestException('Folders must be a list of paths');
    }

    return Promise.all(
      folders.map(async (folder: string) => {
        const resolved = path.resolve(folder);
        const stats = await fs.stat(resolved).catch(() => undefined);

        if (!stats?.isDirectory()) {
          throw new BadRequestException(`Not a directory: ${folder}`);
        }

        return resolved;
      }),
    );
  }

  private async findFiles(
    folders: string[],
    target: MediaMatchTarget,
  ): Promise<FoundFile[]> {
    const files: FoundFile[] = [];

    for (const titleFolder of await this.findTitleFolders(folders, target)) {
      files.push(...(await this.walkVideoFiles(titleFolder, MAX_DEPTH)));
    }

    return files;
  }

  private async findTitleFolders(
    folders: string[],
    target: MediaMatchTarget,
  ): Promise<string[]> {
    const titleFolders: string[] = [];

    for (const folder of folders) {
      for (const entry of await this.readDirectory(folder)) {
        if (!(await this.isDirectory(entry, folder))) continue;
        if (!folderMatchesTarget(parseMediaFolderName(entry.name), target))
          continue;

        titleFolders.push(path.join(folder, entry.name));
      }
    }

    return titleFolders;
  }

  /** Video files with their sidecar subtitles */
  private async walkVideoFiles(
    dir: string,
    depth: number,
  ): Promise<FoundFile[]> {
    const files: FoundFile[] = [];
    const videos: { path: string; name: string }[] = [];
    const subtitles: string[] = [];

    for (const entry of await this.readDirectory(dir)) {
      const entryPath = path.join(dir, entry.name);

      if (await this.isDirectory(entry, dir)) {
        if (depth > 1)
          files.push(...(await this.walkVideoFiles(entryPath, depth - 1)));
      } else if (isVideoFile(entry.name)) {
        videos.push({ path: entryPath, name: entry.name });
      } else if (isSubtitleFile(entry.name)) {
        subtitles.push(entry.name);
      }
    }

    for (const video of videos) {
      const stats = await fs.stat(video.path);
      if (!stats.isFile()) continue;

      files.push({
        ...video,
        size: stats.size,
        modifiedAt: stats.mtime,
        subtitles: subtitles.flatMap((fileName) => {
          const parsed = parseSubtitleName(fileName, video.name);
          return parsed ? [{ fileName, ...parsed }] : [];
        }),
      });
    }

    return files;
  }

  private async readDirectory(dir: string): Promise<Dirent[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    return entries
      .filter((entry) => !entry.name.startsWith('.'))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private async isDirectory(entry: Dirent, parent: string): Promise<boolean> {
    if (!entry.isSymbolicLink()) return entry.isDirectory();

    const stats = await fs
      .stat(path.join(parent, entry.name))
      .catch(() => undefined);
    return stats?.isDirectory() ?? false;
  }
}

function toFileTarget(numbers: {
  season: number;
  episodes: number[];
}): FileTarget {
  return {
    season: numbers.season,
    episode: Math.min(...numbers.episodes),
    lastEpisode: Math.max(...numbers.episodes),
  };
}

function toFileDto(id: string, file: FoundFile): LocalMediaFileDto {
  return {
    id,
    fileName: file.name,
    size: file.size,
    subtitles: file.subtitles,
  };
}
