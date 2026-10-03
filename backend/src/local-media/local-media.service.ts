import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Dirent, promises as fs } from 'fs';
import * as path from 'path';
import { MetadataService } from '../metadata/metadata.service.js';
import { SettingsService } from '../settings/settings.service.js';
import {
  LocalEpisodeFileDto,
  LocalMediaFileDto,
  LocalMediaSettingsDto,
  LocalSubtitleFileDto,
} from './local-media.dto.js';
import {
  decodeFileId,
  encodeFileId,
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

const SETTINGS_KEY = 'local-media';

const DEFAULT_SETTINGS: LocalMediaSettingsDto = {
  movieFolders: [],
  seriesFolders: [],
};

// Title folder -> season folder -> file is the deepest layout Radarr and Sonarr produce
const MAX_DEPTH = 3;

interface FoundFile {
  path: string;
  name: string;
  size: number;
  subtitles: LocalSubtitleFileDto[];
}

@Injectable()
export class LocalMediaService {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly metadataService: MetadataService,
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
    const files = await this.findFiles(movieFolders, target);

    return files.map(toFileDto);
  }

  async getSeriesFiles(tmdbId: string): Promise<LocalEpisodeFileDto[]> {
    const { target } = await this.getSeriesTarget(tmdbId);
    const { seriesFolders } = await this.getSettings();
    const files = await this.findFiles(seriesFolders, target);

    return files.flatMap((file) => {
      const numbers = parseEpisodeNumbers(file.name);
      return numbers ? [{ ...toFileDto(file), ...numbers }] : [];
    });
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
   * Adds a video file to the library as the given episodes of a series. The
   * file is hard linked so it takes no extra space, or copied when the
   * source is on another filesystem.
   */
  async importEpisodeFile(options: {
    tmdbId: string;
    season: number;
    episodes: number[];
    sourcePath: string;
  }): Promise<string> {
    const { tmdbId, season, episodes, sourcePath } = options;
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
      episodeFileName(name, season, episodes, path.extname(sourcePath)),
    );

    await fs.mkdir(seasonFolder, { recursive: true });
    await fs.link(sourcePath, destination).catch(async (error) => {
      if (error.code === 'EEXIST') throw error;

      // A file that is still being copied must not look like an episode
      const partial = `${destination}.partial`;
      await fs.copyFile(sourcePath, partial);
      await fs.rename(partial, destination);
    });

    return destination;
  }

  /**
   * Turns a file id back into a path, accepting only video files below one
   * of the configured library folders.
   */
  resolveFilePath(id: string): Promise<string> {
    return this.resolvePath(id, isVideoFile);
  }

  /** The subtitle file as WebVTT, which is what browsers play */
  async readSubtitles(id: string): Promise<string> {
    const filePath = await this.resolvePath(id, isSubtitleFile);
    const text = await fs.readFile(filePath, 'utf8');

    return path.extname(filePath).toLowerCase() === '.srt'
      ? srtToWebVtt(text)
      : text;
  }

  private async resolvePath(
    id: string,
    isAccepted: (fileName: string) => boolean,
  ): Promise<string> {
    const filePath = path.resolve(decodeFileId(id));
    const { movieFolders, seriesFolders } = await this.getSettings();

    const isAllowed =
      isAccepted(filePath) &&
      [...movieFolders, ...seriesFolders].some((folder) =>
        isInsideFolder(filePath, folder),
      );
    const stats = isAllowed
      ? await fs.stat(filePath).catch(() => undefined)
      : undefined;

    if (!stats?.isFile()) throw new NotFoundException('File not found');

    return filePath;
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
    const subtitles: { path: string; name: string }[] = [];

    for (const entry of await this.readDirectory(dir)) {
      const entryPath = path.join(dir, entry.name);

      if (await this.isDirectory(entry, dir)) {
        if (depth > 1)
          files.push(...(await this.walkVideoFiles(entryPath, depth - 1)));
      } else if (isVideoFile(entry.name)) {
        videos.push({ path: entryPath, name: entry.name });
      } else if (isSubtitleFile(entry.name)) {
        subtitles.push({ path: entryPath, name: entry.name });
      }
    }

    for (const video of videos) {
      const stats = await fs.stat(video.path);
      if (!stats.isFile()) continue;

      files.push({
        ...video,
        size: stats.size,
        subtitles: subtitles.flatMap((subtitle) => {
          const parsed = parseSubtitleName(subtitle.name, video.name);
          return parsed
            ? [
                {
                  id: encodeFileId(subtitle.path),
                  fileName: subtitle.name,
                  ...parsed,
                },
              ]
            : [];
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

function toFileDto(file: FoundFile): LocalMediaFileDto {
  return {
    id: encodeFileId(file.path),
    fileName: file.name,
    size: file.size,
    subtitles: file.subtitles,
  };
}
