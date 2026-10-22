import { Injectable, NotFoundException } from '@nestjs/common';
import { Dirent, promises as fs } from 'fs';
import * as path from 'path';
import { MediaType } from '../common/common.dto.js';
import { readDirectory } from './disk.utils.js';
import {
  LibraryEpisodeFileDto,
  LibraryFileDto,
  SubtitleFileDto,
} from './library.dto.js';
import { LibraryService } from './library.service.js';
import {
  isInsideFolder,
  isSubtitleFile,
  parseEpisodeNumbers,
  parseSubtitleName,
  srtToWebVtt,
} from './library.utils.js';
import { MediaFile } from './media-file.entity.js';
import { ScanService } from './scan.service.js';

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

/**
 * The files of a title as the title pages and the player see them: the
 * indexed files that are on disk, with the subtitles next to them, and the
 * video and subtitle files themselves
 */
@Injectable()
export class PlaybackService {
  constructor(
    private readonly libraryService: LibraryService,
    private readonly scanService: ScanService,
  ) {}

  /**
   * The indexed files of a movie that are on disk, as of the last scan of the
   * title. Asks for a scan, at once when a file is missing.
   */
  async listMovieFiles(tmdbId: string): Promise<LibraryFileDto[]> {
    const { files, isAnyMissing } = await this.statIndexedFiles(
      MediaType.Movie,
      tmdbId,
    );
    await this.scanService.requestScan(MediaType.Movie, tmdbId, {
      now: isAnyMissing,
    });

    return files.map(({ file, size, subtitles }) => ({
      id: file.id,
      fileName: path.basename(file.path),
      size,
      subtitles,
      managed: file.managed,
      infoHash: file.infoHash,
    }));
  }

  /**
   * The indexed episode files of a series that are on disk, as of the last
   * scan of the title. Asks for a scan, at once when a file is missing.
   */
  async listSeriesFiles(tmdbId: string): Promise<LibraryEpisodeFileDto[]> {
    const { files, isAnyMissing } = await this.statIndexedFiles(
      MediaType.Series,
      tmdbId,
    );
    await this.scanService.requestScan(MediaType.Series, tmdbId, {
      now: isAnyMissing,
    });

    return files.map(({ file, size, subtitles }) => {
      const fileName = path.basename(file.path);
      const numbers = parseEpisodeNumbers(fileName);

      return {
        id: file.id,
        fileName,
        size,
        subtitles,
        managed: file.managed,
        infoHash: file.infoHash,
        season: file.season,
        episodes:
          numbers?.season === file.season
            ? numbers.episodes
            : range(file.episode, file.lastEpisode),
      };
    });
  }

  async listEpisodeFiles(
    tmdbId: string,
    season: number,
    episode: number,
  ): Promise<LibraryEpisodeFileDto[]> {
    const files = (await this.listSeriesFiles(tmdbId)).filter(
      (file) => file.season === season && file.episodes.includes(episode),
    );
    // A file that was put into the library by hand is indexed by a scan
    if (!files.length) {
      await this.scanService.requestScan(MediaType.Series, tmdbId, {
        now: true,
      });
    }

    return files;
  }

  /** The indexed files of a title that are files in a library folder, and whether any is not */
  private async statIndexedFiles(mediaType: MediaType, tmdbId: string) {
    const settings = await this.libraryService.getSettings();
    const folders =
      mediaType === MediaType.Movie
        ? settings.movieFolders
        : settings.seriesFolders;
    // In the order of the library folders, which decides the version that
    // plays first, and by path within one
    const folderOf = (file: MediaFile) =>
      folders.findIndex((folder) => isInsideFolder(file.path, folder));
    const indexed = (
      await this.libraryService.findFilesOfTitle(mediaType, tmdbId)
    ).sort((a, b) => folderOf(a) - folderOf(b) || a.path.localeCompare(b.path));
    // A folder that is not mounted does not read as missing files
    for (const folder of folders) {
      if (indexed.some((file) => isInsideFolder(file.path, folder))) {
        await this.libraryService.readAvailableLibraryFolder(folder);
      }
    }

    const directories = new Map<string, Dirent[]>();
    const files: {
      file: MediaFile;
      size: number;
      subtitles: SubtitleFileDto[];
    }[] = [];
    let isAnyMissing = false;
    for (const file of indexed) {
      const isInLibrary = folders.some((folder) =>
        isInsideFolder(file.path, folder),
      );
      const stats = isInLibrary
        ? await fs.stat(file.path).catch(() => undefined)
        : undefined;
      if (!stats?.isFile()) {
        isAnyMissing = true;
        continue;
      }

      const directory = path.dirname(file.path);
      if (!directories.has(directory)) {
        directories.set(
          directory,
          await readDirectory(directory).catch(() => []),
        );
      }
      const videoName = path.basename(file.path);
      files.push({
        file,
        size: stats.size,
        subtitles: directories.get(directory).flatMap((entry) => {
          if (!isSubtitleFile(entry.name)) return [];

          const parsed = parseSubtitleName(entry.name, videoName);
          return parsed ? [{ fileName: entry.name, ...parsed }] : [];
        }),
      });
    }

    return { files, isAnyMissing };
  }

  /** The path of an indexed video file */
  async getStreamPath(id: string): Promise<string> {
    const file = await this.libraryService.findFile(id);
    await this.assertInLibrary(file.path);

    return file.path;
  }

  /**
   * A subtitle file next to an indexed video, as WebVTT, which is what
   * browsers play
   */
  async readSubtitles(id: string, fileName: string): Promise<string> {
    const file = await this.libraryService.findFile(id);

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

  /** The library folders can have changed since the file was indexed */
  private async assertInLibrary(filePath: string): Promise<void> {
    const { movieFolders, seriesFolders } =
      await this.libraryService.getSettings();

    const isInLibrary = [...movieFolders, ...seriesFolders].some((folder) =>
      isInsideFolder(filePath, folder),
    );
    const stats = isInLibrary
      ? await fs.stat(filePath).catch(() => undefined)
      : undefined;

    if (!stats?.isFile()) throw new NotFoundException('File not found');
  }
}
