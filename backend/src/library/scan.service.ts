import { EntityManager } from '@mikro-orm/sqlite';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Dirent, promises as fs } from 'fs';
import * as path from 'path';
import { MediaType } from '../common/common.dto.js';
import { JobsService } from '../jobs/jobs.service.js';
import { TmdbService } from '../metadata/tmdb/tmdb.service.js';
import { LogType } from '../server-log/log-entry.entity.js';
import { ServerLogService } from '../server-log/server-log.service.js';
import { CLEANUP_HOUR } from './cleanup.utils.js';
import {
  filterGone,
  isDirectory,
  isNoLongerFile,
  readDirectory,
} from './disk.utils.js';
import { ScanLibraryResultDto } from './library.dto.js';
import {
  IndexableFile,
  LibraryService,
  LibraryUnavailableError,
} from './library.service.js';
import {
  describeError,
  folderMatchesTitle,
  isInsideFolder,
  isVideoFile,
  normalizeTitle,
  parseEpisodeNumbers,
  parseMediaFolderName,
  relativePath,
  TitleMatch,
  yearOf,
} from './library.utils.js';
import { MediaFile } from './media-file.entity.js';

// Title folder -> season folder -> file is the deepest layout Radarr and Sonarr produce
const MAX_DEPTH = 3;

// How soon a title that is looked at is scanned
const SCAN_DELAY = 30_000;

/** A video file on disk */
interface FoundFile {
  path: string;
  name: string;
  size: number;
  modifiedAt: Date;
}

/** What a file is, as far as its name tells */
type EpisodeRange = Pick<MediaFile, 'season' | 'episode' | 'lastEpisode'>;

/**
 * Brings the index in line with the disk: the job `library.scanTitle` for
 * the title folders of one title, asked for whenever a title is looked at,
 * and `library.scanFolder` for a whole library folder, every night and
 * from the server page
 */
@Injectable()
export class ScanService implements OnModuleInit {
  private readonly logger = new Logger(ScanService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly libraryService: LibraryService,
    private readonly tmdbService: TmdbService,
    private readonly jobs: JobsService,
    private readonly serverLog: ServerLogService,
  ) {}

  onModuleInit() {
    this.jobs.define('library.scanTitle', {
      dropAtRestart: true,
      run: ({ mediaType, tmdbId }) => this.scanTitle(mediaType, tmdbId),
    });
    // A scan that did not run at 04:00 waits for the next one
    this.jobs.define('library.scanFolder', {
      dropAtRestart: true,
      run: ({ folder }) => this.runFolderScan(folder),
    });
  }

  /** The nightly scans of every library folder, at the hour of the cleanup, which does not wait for them */
  @Cron(`0 ${CLEANUP_HOUR} * * *`)
  async scanNightly(): Promise<void> {
    const { movieFolders, seriesFolders } =
      await this.libraryService.getSettings();

    await this.em.fork().transactional(async (tx) => {
      for (const folder of [...seriesFolders, ...movieFolders]) {
        await this.jobs.enqueue(tx, 'library.scanFolder', { folder });
      }
    });
  }

  /**
   * Queues a scan of a title, at once or soon. The queued one keeps the
   * earlier time, so a title that is looked at all the time is scanned once
   * per delay.
   */
  requestScan(
    mediaType: MediaType,
    tmdbId: string,
    { now = false }: { now?: boolean } = {},
  ): Promise<void> {
    return this.jobs.enqueue(
      this.em,
      'library.scanTitle',
      { mediaType, tmdbId },
      { runAt: new Date(Date.now() + (now ? 0 : SCAN_DELAY)) },
    );
  }

  /**
   * Brings the index of a title in line with what is in its title folders:
   * the job `library.scanTitle`
   */
  async scanTitle(mediaType: MediaType, tmdbId: string): Promise<void> {
    const { movieFolders, seriesFolders } =
      await this.libraryService.getSettings();
    const folders =
      mediaType === MediaType.Movie ? movieFolders : seriesFolders;
    const { match } = await this.libraryService.getTitleMatch(
      mediaType,
      tmdbId,
    );

    const videos = await this.walkTitleFolders(folders, match);
    const found =
      mediaType === MediaType.Movie
        ? videos.map(toMovieFile)
        : videos.flatMap(toEpisodeFile);
    await this.syncTitleIndex(mediaType, tmdbId, { folders, match }, found);
  }

  /**
   * What a scan of a library folder would forget: the indexed files that are
   * not on disk, or all of them when the folder is not available.
   */
  async previewScan(
    folder: string,
  ): Promise<{ available: boolean; reason?: string; missing: MediaFile[] }> {
    await this.libraryService.getLibraryFolderType(folder);
    const indexed = await this.libraryService.findFilesInside(folder);
    const reason = await this.libraryService
      .readAvailableLibraryFolder(folder)
      .then(
        () => undefined,
        (error) => {
          if (!(error instanceof LibraryUnavailableError)) throw error;
          return error.message;
        },
      );
    if (reason) return { available: false, reason, missing: indexed };

    return { available: true, missing: await filterGone(indexed) };
  }

  /**
   * Brings the index of a library folder in line with the disk: new video
   * files get external rows, changed ones are updated and the ones that are
   * gone are forgotten, which makes their requests download them again. A
   * folder that is not available is only scanned with `evenIfUnavailable`:
   * it is read as it is, so everything that was indexed in it is forgotten.
   */
  async scanFolder(
    folder: string,
    options: { evenIfUnavailable?: boolean } = {},
  ): Promise<ScanLibraryResultDto> {
    const mediaType = await this.libraryService.getLibraryFolderType(folder);
    // Read before the walk, so that a file indexed meanwhile is not taken for gone
    const indexed = await this.libraryService.findFilesInside(folder);
    const entries = options.evenIfUnavailable
      ? await readDirectory(folder).catch((): Dirent[] => [])
      : await this.libraryService.readAvailableLibraryFolder(folder);

    const result: ScanLibraryResultDto = {
      added: 0,
      updated: 0,
      forgotten: 0,
      unresolved: [],
      failed: [],
    };
    // Nothing under an entry that could not be read is forgotten
    const unreadable: string[] = [];
    const fail = (entryPath: string, error: Error) => {
      unreadable.push(entryPath);
      result.failed.push({
        path: relativePath(folder, entryPath),
        error: describeError(error),
      });
    };

    const found: IndexableFile[] = [];
    for (const entry of entries) {
      if (!(await isDirectory(entry, folder))) continue;
      const titleFolder = path.join(folder, entry.name);

      const videos = await this.walkVideoFiles(titleFolder, MAX_DEPTH, fail);
      const files =
        mediaType === MediaType.Series
          ? videos.flatMap(toEpisodeFile)
          : videos.map(toMovieFile);
      if (!files.length) continue;

      const tmdbId = await this.matchTitleFolder(
        entry.name,
        mediaType,
        indexed.filter((file) => isInsideFolder(file.path, titleFolder)),
      ).catch((error: Error) => {
        fail(titleFolder, error);
        return undefined;
      });
      if (!tmdbId) {
        result.unresolved.push(entry.name);
        continue;
      }

      found.push(...files.map((file) => ({ ...file, tmdbId })));
    }

    const foundPaths = new Set(found.map((file) => file.path));
    const gone = await filterGone(
      indexed.filter(
        (file) =>
          !foundPaths.has(file.path) &&
          !unreadable.some((dir) => isInsideFolder(file.path, dir)),
      ),
    );
    await this.libraryService.forgetFiles(gone);
    const { added, updated } = await this.libraryService.upsertFiles(
      mediaType,
      found,
      indexed,
    );

    return { ...result, added, updated, forgotten: gone.length };
  }

  /**
   * The nightly scan of a library folder: the job `library.scanFolder`. A
   * folder that is not available is left as it is and the failure is logged:
   * it is only scanned by hand.
   */
  private async runFolderScan(folder: string): Promise<void> {
    const { movieFolders, seriesFolders } =
      await this.libraryService.getSettings();
    // Removed from the library since the job was queued
    if (![...movieFolders, ...seriesFolders].includes(folder)) return;

    let result: ScanLibraryResultDto;
    try {
      result = await this.scanFolder(folder);
    } catch (error) {
      if (!(error instanceof LibraryUnavailableError)) throw error;

      await this.serverLog.write(
        LogType.ScanFailed,
        `Did not scan "${folder}": ${error.message}`,
        { folder },
      );
      return;
    }

    this.logger.log(
      `Scanned "${folder}": ${result.added} added, ${result.updated} updated, ${result.forgotten} forgotten` +
        (result.unresolved.length
          ? `, ${result.unresolved.length} folders not recognised`
          : '') +
        (result.failed.length
          ? `, ${result.failed.length} entries not read`
          : ''),
    );
  }

  /**
   * Brings the indexed files of a title in line with what was found on disk.
   * A file is forgotten when it is gone or no longer in a title folder of the
   * title.
   */
  private async syncTitleIndex(
    mediaType: MediaType,
    tmdbId: string,
    library: { folders: string[]; match: TitleMatch },
    found: (FoundFile & EpisodeRange)[],
  ): Promise<void> {
    const indexed = await this.libraryService.findFilesOfTitle(
      mediaType,
      tmdbId,
    );
    const foundPaths = new Set(found.map((file) => file.path));

    // A file that the walk did not see can have been imported since it ran
    const gone: MediaFile[] = [];
    for (const file of indexed) {
      if (foundPaths.has(file.path)) continue;

      const folder = library.folders.find((folder) =>
        isInsideFolder(file.path, folder),
      );
      const [titleFolder] = folder
        ? path.relative(folder, file.path).split(path.sep)
        : [];
      const isOfTitle =
        !!titleFolder &&
        folderMatchesTitle(parseMediaFolderName(titleFolder), library.match);
      if (!isOfTitle || (await isNoLongerFile(file.path))) gone.push(file);
    }

    await this.libraryService.forgetFiles(gone);
    await this.libraryService.upsertFiles(
      mediaType,
      found.map((file) => ({ ...file, tmdbId })),
      indexed,
    );
  }

  /**
   * The title a folder of a library folder is for: by the id tag in its name,
   * by what is indexed in it, or by what TMDB finds for its imdb or tvdb tag
   * or for its name and year. Nothing when none of them fits.
   */
  private async matchTitleFolder(
    name: string,
    mediaType: MediaType,
    indexed: MediaFile[],
  ): Promise<string | undefined> {
    const parsed = parseMediaFolderName(name);
    if (parsed.tmdbId) return parsed.tmdbId;

    const known = new Set(indexed.map((file) => file.tmdbId));
    if (known.size === 1) return indexed[0].tmdbId;

    if (parsed.imdbId || parsed.tvdbId) {
      const found = await this.tmdbService.findByExternalId(
        mediaType,
        parsed.imdbId ? 'imdb_id' : 'tvdb_id',
        parsed.imdbId ?? parsed.tvdbId,
      );

      return found?.tmdbId;
    }
    if (!parsed.title) return undefined;

    const results = await this.tmdbService.searchTitles(
      mediaType,
      parsed.name,
      parsed.year,
    );

    return results.find((result) =>
      folderMatchesTitle(parsed, {
        tmdbId: result.tmdbId,
        titles: result.titles.filter(Boolean).map(normalizeTitle),
        year: yearOf(result.date),
      }),
    )?.tmdbId;
  }

  private async walkTitleFolders(
    folders: string[],
    match: TitleMatch,
  ): Promise<FoundFile[]> {
    const files: FoundFile[] = [];

    for (const titleFolder of await this.libraryService.findTitleFolders(
      folders,
      match,
    )) {
      files.push(...(await this.walkVideoFiles(titleFolder, MAX_DEPTH)));
    }

    return files;
  }

  /**
   * The video files under a directory. A directory that cannot be read
   * fails the walk, or is reported and skipped when a handler is given.
   */
  private async walkVideoFiles(
    dir: string,
    depth: number,
    onUnreadable?: (dir: string, error: Error) => void,
  ): Promise<FoundFile[]> {
    const files: FoundFile[] = [];

    const entries = onUnreadable
      ? await readDirectory(dir).catch((error: Error) => {
          onUnreadable(dir, error);
          return [];
        })
      : await readDirectory(dir);
    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);

      if (await isDirectory(entry, dir)) {
        if (depth > 1) {
          files.push(
            ...(await this.walkVideoFiles(entryPath, depth - 1, onUnreadable)),
          );
        }
      } else if (isVideoFile(entry.name)) {
        // A link that leads nowhere is not a file
        const stats = await fs.stat(entryPath).catch(() => undefined);
        if (!stats?.isFile()) continue;

        files.push({
          path: entryPath,
          name: entry.name,
          size: stats.size,
          modifiedAt: stats.mtime,
        });
      }
    }

    return files;
  }
}

function toEpisodeRange(numbers: {
  season: number;
  episodes: number[];
}): EpisodeRange {
  return {
    season: numbers.season,
    episode: Math.min(...numbers.episodes),
    lastEpisode: Math.max(...numbers.episodes),
  };
}

/** The episodes a video is by its name, or nothing for a video that is not one */
function toEpisodeFile(file: FoundFile): (FoundFile & EpisodeRange)[] {
  const numbers = parseEpisodeNumbers(file.name);

  return numbers ? [{ ...file, ...toEpisodeRange(numbers) }] : [];
}

function toMovieFile(file: FoundFile): FoundFile & EpisodeRange {
  return { ...file, season: 0, episode: 0, lastEpisode: 0 };
}
