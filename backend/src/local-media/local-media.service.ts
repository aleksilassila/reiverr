import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Dirent, promises as fs } from 'fs';
import * as path from 'path';
import { MetadataService } from 'src/metadata/metadata.service';
import { SettingsService } from 'src/settings/settings.service';
import {
  LocalEpisodeFileDto,
  LocalMediaFileDto,
  LocalMediaSettingsDto,
} from './local-media.dto';
import {
  decodeFileId,
  encodeFileId,
  folderMatchesTarget,
  isInsideFolder,
  isVideoFile,
  MediaMatchTarget,
  normalizeTitle,
  parseEpisodeNumbers,
  parseMediaFolderName,
  yearOf,
} from './local-media.utils';

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
    const metadata = await this.metadataService.getSeriesByTmdbId(tmdbId);
    if (!metadata) throw new NotFoundException('Series not found');

    const series = metadata.tmdbSeries;
    const target: MediaMatchTarget = {
      tmdbId,
      imdbId: series.external_ids?.imdb_id,
      tvdbId: series.external_ids?.tvdb_id
        ? String(series.external_ids.tvdb_id)
        : undefined,
      titles: [series.name, series.original_name]
        .filter(Boolean)
        .map(normalizeTitle),
      year: yearOf(series.first_air_date),
    };

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
   * Turns a file id back into a path, accepting only video files below one
   * of the configured library folders.
   */
  async resolveFilePath(id: string): Promise<string> {
    const filePath = path.resolve(decodeFileId(id));
    const { movieFolders, seriesFolders } = await this.getSettings();

    const isAllowed =
      isVideoFile(filePath) &&
      [...movieFolders, ...seriesFolders].some((folder) =>
        isInsideFolder(filePath, folder),
      );
    const stats = isAllowed
      ? await fs.stat(filePath).catch(() => undefined)
      : undefined;

    if (!stats?.isFile()) throw new NotFoundException('File not found');

    return filePath;
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

    for (const folder of folders) {
      for (const entry of await this.readDirectory(folder)) {
        if (!(await this.isDirectory(entry, folder))) continue;
        if (!folderMatchesTarget(parseMediaFolderName(entry.name), target))
          continue;

        files.push(
          ...(await this.walkVideoFiles(
            path.join(folder, entry.name),
            MAX_DEPTH,
          )),
        );
      }
    }

    return files;
  }

  private async walkVideoFiles(
    dir: string,
    depth: number,
  ): Promise<FoundFile[]> {
    const files: FoundFile[] = [];

    for (const entry of await this.readDirectory(dir)) {
      const entryPath = path.join(dir, entry.name);

      if (await this.isDirectory(entry, dir)) {
        if (depth > 1)
          files.push(...(await this.walkVideoFiles(entryPath, depth - 1)));
      } else if (isVideoFile(entry.name)) {
        const stats = await fs.stat(entryPath);
        if (stats.isFile())
          files.push({ path: entryPath, name: entry.name, size: stats.size });
      }
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
  return { id: encodeFileId(file.path), fileName: file.name, size: file.size };
}
