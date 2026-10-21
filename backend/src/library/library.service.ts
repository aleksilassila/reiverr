import { EntityManager } from '@mikro-orm/sqlite';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Dirent, promises as fs } from 'fs';
import { randomUUID } from 'node:crypto';
import * as path from 'path';
import { MediaType } from '../common/common.dto.js';
import { JobsService } from '../jobs/jobs.service.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { TmdbService } from '../metadata/tmdb/tmdb.service.js';
import { LogType } from '../server-log/log-entry.entity.js';
import { ServerLogService } from '../server-log/server-log.service.js';
import { SettingsService } from '../settings/settings.service.js';
import {
  CleanupSchedule,
  LibraryEntryDto,
  ScanLibraryResultDto,
  LibraryEpisodeFileDto,
  LibraryFileDto,
  LibrarySettingsDto,
  SubtitleFileDto,
} from './library.dto.js';
import {
  describeError,
  folderMatchesTitle,
  isInsideFolder,
  isSubtitleFile,
  isVideoFile,
  TitleMatch,
  normalizeTitle,
  parseEpisodeNumbers,
  parseMediaFolderName,
  parseSubtitleName,
  relativePath,
  srtToWebVtt,
  yearOf,
} from './library.utils.js';
import { MediaFile } from './media-file.entity.js';
import { RequestBinding } from './request-binding.entity.js';

const SETTINGS_KEY = 'library';

const DEFAULT_SETTINGS: LibrarySettingsDto = {
  movieFolders: [],
  seriesFolders: [],
  cleanup: CleanupSchedule.Daily,
};

// Title folder -> season folder -> file is the deepest layout Radarr and Sonarr produce
const MAX_DEPTH = 3;

// SQLite limits the number of values in one statement
const INDEX_BATCH_SIZE = 500;

// How many files of a library folder are looked at at a time
const STAT_BATCH_SIZE = 64;

interface FoundFile {
  path: string;
  name: string;
  size: number;
  modifiedAt: Date;
  subtitles: SubtitleFileDto[];
}

/** What a file is, as far as its name tells */
type EpisodeRange = Pick<MediaFile, 'season' | 'episode' | 'lastEpisode'>;

/** A file on disk with the title it belongs to */
type IndexableFile = FoundFile & EpisodeRange & { tmdbId: string };

/**
 * A library folder that cannot be read, or that is empty while files are
 * indexed in it: taken for a disk that is not mounted, so nothing is forgotten
 * or written there. Routes answer it with 503.
 */
export class LibraryUnavailableError extends ServiceUnavailableException {}

// How soon a title that is looked at is scanned
const SCAN_DELAY = 30_000;

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

export const INDEXED_FIELDS = [
  'mediaType',
  'tmdbId',
  'season',
  'episode',
  'lastEpisode',
  'size',
  'modifiedAt',
] as const;

@Injectable()
export class LibraryService implements OnModuleInit {
  private readonly logger = new Logger(LibraryService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly settingsService: SettingsService,
    private readonly metadataService: MetadataService,
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

  getSettings(): Promise<LibrarySettingsDto> {
    return this.settingsService.getOrCreateValue(
      SETTINGS_KEY,
      DEFAULT_SETTINGS,
    );
  }

  /**
   * Sets the library folders and the cleanup schedule. Removing a folder
   * that has indexed files in it forgets them, and their requests download
   * them again, so it takes `forgetFiles`.
   */
  async updateSettings(
    settings: LibrarySettingsDto,
    { forgetFiles = false }: { forgetFiles?: boolean } = {},
  ): Promise<LibrarySettingsDto> {
    if (!Object.values(CleanupSchedule).includes(settings.cleanup)) {
      throw new BadRequestException(
        `cleanup must be one of ${Object.values(CleanupSchedule).join(', ')}`,
      );
    }
    const value: LibrarySettingsDto = {
      movieFolders: await this.validateFolders(settings.movieFolders),
      seriesFolders: await this.validateFolders(settings.seriesFolders),
      cleanup: settings.cleanup,
    };

    const current = await this.getSettings();
    const kept = [...value.movieFolders, ...value.seriesFolders];
    const removed = [...current.movieFolders, ...current.seriesFolders].filter(
      (folder) => !kept.includes(folder),
    );
    // A folder inside a removed one can stay
    const forgotten = [
      ...new Map(
        (
          await Promise.all(
            removed.map((folder) => this.findFilesInside(folder)),
          )
        )
          .flat()
          .filter(
            (file) => !kept.some((folder) => isInsideFolder(file.path, folder)),
          )
          .map((file) => [file.id, file]),
      ).values(),
    ];
    if (forgotten.length && !forgetFiles) {
      throw new BadRequestException(
        `${forgotten.length} indexed files are in the folders that are removed. Removing them forgets the files, and their requests download them again`,
      );
    }
    await this.forgetFiles(forgotten);

    const saved = await this.settingsService.saveValue(SETTINGS_KEY, value);
    // Imports that wait for a folder that was missing or unreadable
    await this.jobs.runNow(this.em, 'library.importItem');

    return saved;
  }

  /**
   * The indexed files of a movie that are on disk, as of the last scan of the
   * title. Asks for a scan, at once when a file is missing.
   */
  async listMovieFiles(tmdbId: string): Promise<LibraryFileDto[]> {
    const { files, isAnyMissing } = await this.statIndexedFiles(
      MediaType.Movie,
      tmdbId,
    );
    await this.requestScan(
      MediaType.Movie,
      tmdbId,
      isAnyMissing ? 0 : SCAN_DELAY,
    );

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
    await this.requestScan(
      MediaType.Series,
      tmdbId,
      isAnyMissing ? 0 : SCAN_DELAY,
    );

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
    if (!files.length) await this.requestScan(MediaType.Series, tmdbId, 0);

    return files;
  }

  /**
   * Brings the index of a title in line with what is in its title folders:
   * the job `library.scanTitle`
   */
  async scanTitle(mediaType: MediaType, tmdbId: string): Promise<void> {
    const { movieFolders, seriesFolders } = await this.getSettings();

    if (mediaType === MediaType.Movie) {
      const metadata = await this.metadataService.getMovieByTmdbId(tmdbId);
      if (!metadata) throw new NotFoundException('Movie not found');

      const movie = metadata.tmdbMovie;
      const match: TitleMatch = {
        tmdbId,
        imdbId: movie.imdb_id ?? movie.external_ids?.imdb_id,
        titles: [movie.title, movie.original_title]
          .filter(Boolean)
          .map(normalizeTitle),
        year: yearOf(movie.release_date),
      };
      const found = (await this.walkTitleFolders(movieFolders, match)).map(
        toMovieFile,
      );
      await this.syncTitleIndex(
        MediaType.Movie,
        tmdbId,
        { folders: movieFolders, match },
        found,
      );
      return;
    }

    const { match } = await this.getSeriesMatch(tmdbId);
    const found = (await this.walkTitleFolders(seriesFolders, match)).flatMap(
      toEpisodeFile,
    );
    await this.syncTitleIndex(
      MediaType.Series,
      tmdbId,
      { folders: seriesFolders, match },
      found,
    );
  }

  /** The indexed files of a title that are files in a library folder, and whether any is not */
  private async statIndexedFiles(mediaType: MediaType, tmdbId: string) {
    const settings = await this.getSettings();
    const folders =
      mediaType === MediaType.Movie
        ? settings.movieFolders
        : settings.seriesFolders;
    // In the order of the library folders, which decides the version that
    // plays first, and by path within one
    const folderOf = (file: MediaFile) =>
      folders.findIndex((folder) => isInsideFolder(file.path, folder));
    const indexed = (await this.findFilesOfTitle(mediaType, tmdbId)).sort(
      (a, b) => folderOf(a) - folderOf(b) || a.path.localeCompare(b.path),
    );
    // A folder that is not mounted does not read as missing files
    for (const folder of folders) {
      if (indexed.some((file) => isInsideFolder(file.path, folder))) {
        await this.readAvailableLibraryFolder(folder);
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
          await this.readDirectory(directory).catch(() => []),
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

  /**
   * Queues a scan of a title. The queued one keeps the earlier time, so a
   * title that is looked at all the time is scanned once per delay.
   */
  private requestScan(mediaType: MediaType, tmdbId: string, delay: number) {
    return this.jobs.enqueue(
      this.em,
      'library.scanTitle',
      { mediaType, tmdbId },
      { runAt: new Date(Date.now() + delay) },
    );
  }

  /** The indexed files of a title, as of its last scan */
  findFilesOfTitle(mediaType: MediaType, tmdbId: string): Promise<MediaFile[]> {
    return this.em.find(
      MediaFile,
      { mediaType, tmdbId },
      { disableIdentityMap: true },
    );
  }

  /** The titles that have imported files in the library */
  async findTitlesWithManagedFiles(mediaType: MediaType): Promise<string[]> {
    const rows: { tmdbId: string }[] = await this.em
      .createQueryBuilder(MediaFile)
      .select('tmdbId', true)
      .where({ mediaType, managed: true })
      .execute();

    return rows.map((row) => row.tmdbId);
  }

  /**
   * Everything in a library folder: its directories and files with their
   * sizes, a directory before what is in it. Symbolic links are listed, not
   * followed. A file that is indexed says so.
   */
  async getLibraryEntries(folder: string): Promise<LibraryEntryDto[]> {
    await this.getLibraryFolderType(folder);
    await this.readAvailableLibraryFolder(folder);

    const entries: LibraryEntryDto[] = [];
    const walk = async (dir: string, entry?: LibraryEntryDto) => {
      const dirents = await fs
        .readdir(dir, { withFileTypes: true })
        .catch((error) => {
          // The folder itself has to be readable, a directory in it is listed as it is
          if (!entry) throw error;
          entry.error = describeError(error);
          return [];
        });

      for (const dirent of dirents.sort(byName)) {
        const entryPath = path.join(dir, dirent.name);
        const isDirectory = dirent.isDirectory();
        const child: LibraryEntryDto = {
          path: relativePath(folder, entryPath),
          isDirectory,
          size: 0,
        };

        entries.push(child);
        if (isDirectory) await walk(entryPath, child);
      }
    };
    await walk(folder);

    const indexed = new Map(
      (await this.findFilesInside(folder)).map((file) => [file.path, file]),
    );
    const files = entries.filter((entry) => !entry.isDirectory);
    for (let i = 0; i < files.length; i += STAT_BATCH_SIZE) {
      await Promise.all(
        files.slice(i, i + STAT_BATCH_SIZE).map(async (entry) => {
          const entryPath = path.join(folder, ...entry.path.split('/'));
          // A link that leads nowhere has no size either
          const stats = await fs.stat(entryPath).catch((error) => {
            entry.error = describeError(error);
            return undefined;
          });
          const file = indexed.get(entryPath);

          entry.size = stats?.isFile() ? stats.size : 0;
          entry.mediaFileId = file?.id;
          entry.managed = file?.managed;
        }),
      );
    }

    return entries;
  }

  /**
   * The absolute paths of entries of a library folder that exist, without the
   * ones that are inside another one of them. An entry is something inside
   * the folder that no symbolic link leads to.
   */
  async validateLibraryEntries(
    folder: string,
    paths: string[],
  ): Promise<string[]> {
    await this.getLibraryFolderType(folder);
    if (
      !Array.isArray(paths) ||
      paths.some((entry) => typeof entry !== 'string' || !entry)
    ) {
      throw new BadRequestException('Paths must be a list of paths');
    }

    const realFolder = await fs.realpath(folder);
    const resolved = new Set<string>();
    for (const entry of paths) {
      const entryPath = path.resolve(folder, ...entry.split('/'));
      if (!isInsideFolder(entryPath, folder)) {
        throw new BadRequestException(`Not in the library folder: ${entry}`);
      }

      if (!(await entryExists(entryPath))) continue;

      const parent = await fs.realpath(path.dirname(entryPath));
      if (parent !== realFolder && !isInsideFolder(parent, realFolder)) {
        throw new BadRequestException(`Not in the library folder: ${entry}`);
      }

      resolved.add(entryPath);
    }

    const isInsideAnother = (entryPath: string) => {
      for (
        let dir = path.dirname(entryPath);
        isInsideFolder(dir, folder);
        dir = path.dirname(dir)
      ) {
        if (resolved.has(dir)) return true;
      }

      return false;
    };

    return [...resolved].filter((entryPath) => !isInsideAnother(entryPath));
  }

  /** The indexed file at a path, or the indexed files inside the directory there */
  async findFilesAt(entryPath: string): Promise<MediaFile[]> {
    const file = await this.em.findOne(
      MediaFile,
      { path: entryPath },
      { disableIdentityMap: true },
    );

    return file ? [file] : this.findFilesInside(entryPath);
  }

  /** The indexed files among entries of a library folder */
  async findLibraryEntryFiles(
    folder: string,
    paths: string[],
  ): Promise<MediaFile[]> {
    const files: MediaFile[] = [];
    for (const entryPath of await this.validateLibraryEntries(folder, paths)) {
      files.push(...(await this.findFilesAt(entryPath)));
    }

    return files;
  }

  /**
   * Marks the indexed files among entries of a library folder managed, so
   * that the cleanup may delete them when no request holds them, or
   * external, so that it never does
   */
  async setLibraryEntriesManaged(
    folder: string,
    paths: string[],
    managed: boolean,
  ): Promise<{ changed: number }> {
    const ids = (await this.findLibraryEntryFiles(folder, paths))
      .filter((file) => file.managed !== managed)
      .map((file) => file.id);
    const changed = ids.length
      ? await this.em.nativeUpdate(MediaFile, { id: { $in: ids } }, { managed })
      : 0;

    return { changed };
  }

  /**
   * What a scan of a library folder would forget: the indexed files that are
   * not on disk, or all of them when the folder is not available.
   */
  async previewScan(
    folder: string,
  ): Promise<{ available: boolean; reason?: string; missing: MediaFile[] }> {
    await this.getLibraryFolderType(folder);
    const indexed = await this.findFilesInside(folder);
    const reason = await this.readAvailableLibraryFolder(folder).then(
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
    const mediaType = await this.getLibraryFolderType(folder);
    // Read before the walk, so that a file indexed meanwhile is not taken for gone
    const indexed = await this.findFilesInside(folder);
    const entries = options.evenIfUnavailable
      ? await this.readDirectory(folder).catch((): Dirent[] => [])
      : await this.readAvailableLibraryFolder(folder);

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
      if (!(await this.isDirectory(entry, folder))) continue;
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
    await this.forgetFiles(gone);
    const { added, updated } = await this.upsertFiles(
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
    const { movieFolders, seriesFolders } = await this.getSettings();
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

  /** The path of an indexed video file */
  async getStreamPath(id: string): Promise<string> {
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

  async findFile(id: string): Promise<MediaFile> {
    const file = await this.em.findOne(
      MediaFile,
      { id },
      { disableIdentityMap: true },
    );
    if (!file) throw new NotFoundException('File not found');

    return file;
  }

  /** What a library folder holds, movies or series */
  async getLibraryFolderType(folder: string): Promise<MediaType> {
    const { movieFolders, seriesFolders } = await this.getSettings();

    if (seriesFolders.includes(folder)) return MediaType.Series;
    if (movieFolders.includes(folder)) return MediaType.Movie;
    throw new BadRequestException('Not a library folder');
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

  findFilesInside(dir: string): Promise<MediaFile[]> {
    return this.em.find(MediaFile, isInside(dir), { disableIdentityMap: true });
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
    const indexed = await this.findFilesOfTitle(mediaType, tmdbId);
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

    await this.forgetFiles(gone);
    await this.upsertFiles(
      mediaType,
      found.map((file) => ({ ...file, tmdbId })),
      indexed,
    );
  }

  /**
   * Forgets indexed files. The requests that had them let go of them in the
   * same transaction, and the library looks at them again, so that they
   * download the files again.
   */
  private async forgetFiles(files: MediaFile[]): Promise<void> {
    if (!files.length) return;

    await this.em.transactional(async (tx) => {
      await tx.nativeDelete(MediaFile, {
        id: { $in: files.map((file) => file.id) },
      });
      await this.filesForgotten(tx, files);
    });
  }

  /**
   * Unbinds the requests that had files whose rows are deleted, in the
   * caller's transaction, and has the library look at the requests again
   */
  async filesForgotten(
    em: EntityManager,
    files: Pick<MediaFile, 'id'>[],
  ): Promise<void> {
    const ids = files.map((file) => file.id);
    if (!ids.length) return;

    const bindings = await em.find(
      RequestBinding,
      { mediaFileId: { $in: ids } },
      { disableIdentityMap: true, fields: ['requestId'] },
    );
    if (!bindings.length) return;

    await em.nativeUpdate(
      RequestBinding,
      { mediaFileId: { $in: ids } },
      { mediaFileId: null, updatedAt: new Date() },
    );
    for (const { requestId } of bindings) {
      await this.jobs.enqueue(em, 'library.reconcileRequest', { requestId });
    }
  }

  /**
   * Writes the rows of the found files that are new or changed. A new row is
   * an external file. A row keeps its id and where the file came from, and a
   * managed row stays as it was imported, because that is what a cleanup
   * checks before it deletes the file.
   */
  private async upsertFiles(
    mediaType: MediaType,
    found: IndexableFile[],
    indexed: MediaFile[],
  ): Promise<{ added: number; updated: number }> {
    const indexedByPath = new Map(indexed.map((file) => [file.path, file]));
    const changed = found.filter((file) => {
      const current = indexedByPath.get(file.path);
      if (current?.managed) return false;

      return (
        !current ||
        current.mediaType !== mediaType ||
        current.tmdbId !== file.tmdbId ||
        current.size !== file.size ||
        current.modifiedAt.getTime() !== file.modifiedAt.getTime() ||
        current.season !== file.season ||
        current.episode !== file.episode ||
        current.lastEpisode !== file.lastEpisode
      );
    });

    for (let i = 0; i < changed.length; i += INDEX_BATCH_SIZE) {
      await this.em
        .createQueryBuilder(MediaFile)
        .insert(
          changed.slice(i, i + INDEX_BATCH_SIZE).map((file) => ({
            id: randomUUID(),
            path: file.path,
            mediaType,
            tmdbId: file.tmdbId,
            season: file.season,
            episode: file.episode,
            lastEpisode: file.lastEpisode,
            size: file.size,
            modifiedAt: file.modifiedAt,
            managed: false,
            createdAt: new Date(),
          })),
        )
        // Also a managed row that was not read: of another title, or imported since
        .onConflict('path')
        .merge([...INDEXED_FIELDS])
        .where({ managed: false })
        .execute();
    }

    const added = changed.filter((file) => !indexedByPath.has(file.path));

    return { added: added.length, updated: changed.length - added.length };
  }

  async getSeriesMatch(
    tmdbId: string,
  ): Promise<{ name: string; match: TitleMatch }> {
    const metadata = await this.metadataService.getSeriesByTmdbId(tmdbId);
    if (!metadata) throw new NotFoundException('Series not found');

    const series = metadata.tmdbSeries;

    return {
      name: series.name,
      match: {
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

  private async validateFolders(folders: unknown): Promise<string[]> {
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

  private async walkTitleFolders(
    folders: string[],
    match: TitleMatch,
  ): Promise<FoundFile[]> {
    const files: FoundFile[] = [];

    for (const titleFolder of await this.findTitleFolders(folders, match)) {
      files.push(...(await this.walkVideoFiles(titleFolder, MAX_DEPTH)));
    }

    return files;
  }

  async findTitleFolders(
    folders: string[],
    match: TitleMatch,
  ): Promise<string[]> {
    const titleFolders: string[] = [];

    for (const folder of folders) {
      for (const entry of await this.readAvailableLibraryFolder(folder)) {
        if (!(await this.isDirectory(entry, folder))) continue;
        if (!folderMatchesTitle(parseMediaFolderName(entry.name), match))
          continue;

        titleFolders.push(path.join(folder, entry.name));
      }
    }

    return titleFolders;
  }

  /**
   * Video files with their sidecar subtitles. A directory that cannot be
   * read fails the walk, or is reported and skipped when a handler is given.
   */
  private async walkVideoFiles(
    dir: string,
    depth: number,
    onUnreadable?: (dir: string, error: Error) => void,
  ): Promise<FoundFile[]> {
    const files: FoundFile[] = [];
    const videos: { path: string; name: string }[] = [];
    const subtitles: string[] = [];

    const entries = onUnreadable
      ? await this.readDirectory(dir).catch((error: Error) => {
          onUnreadable(dir, error);
          return [];
        })
      : await this.readDirectory(dir);
    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);

      if (await this.isDirectory(entry, dir)) {
        if (depth > 1) {
          files.push(
            ...(await this.walkVideoFiles(entryPath, depth - 1, onUnreadable)),
          );
        }
      } else if (isVideoFile(entry.name)) {
        videos.push({ path: entryPath, name: entry.name });
      } else if (isSubtitleFile(entry.name)) {
        subtitles.push(entry.name);
      }
    }

    for (const video of videos) {
      // A link that leads nowhere is not a file
      const stats = await fs.stat(video.path).catch(() => undefined);
      if (!stats?.isFile()) continue;

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

  /**
   * What is in a library folder. A folder that cannot be read, or that is
   * empty while files are indexed in it, is taken for a disk that is not
   * mounted: nothing is read from it, so that no file is forgotten and
   * nothing is written where the disk belongs.
   */
  async readAvailableLibraryFolder(folder: string): Promise<Dirent[]> {
    const unavailable = (reason: string) =>
      new LibraryUnavailableError(
        `Library folder "${folder}" is not available: ${reason}`,
      );

    const entries = await this.readDirectory(folder).catch((error) => {
      throw unavailable(describeError(error));
    });
    if (!entries.length && (await this.em.count(MediaFile, isInside(folder)))) {
      throw unavailable('it is empty, but files are indexed in it');
    }

    return entries;
  }

  private async readDirectory(dir: string): Promise<Dirent[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    return entries.filter((entry) => !entry.name.startsWith('.')).sort(byName);
  }

  private async isDirectory(entry: Dirent, parent: string): Promise<boolean> {
    if (!entry.isSymbolicLink()) return entry.isDirectory();

    const stats = await fs
      .stat(path.join(parent, entry.name))
      .catch(() => undefined);
    return stats?.isDirectory() ?? false;
  }
}

const byName = (a: Dirent, b: Dirent) => a.name.localeCompare(b.name);

/** The condition for the files inside a directory */
const isInside = (dir: string) => ({
  path: {
    $gte: dir + path.sep,
    // The character after the separator ends the range of what is inside
    $lt: dir + String.fromCharCode(path.sep.charCodeAt(0) + 1),
  },
});

/** Whether an indexed file is no longer a file at its path */
/** Whether something is at a path, a dangling link included */
export const entryExists = (filePath: string) =>
  fs.lstat(filePath).then(
    () => true,
    () => false,
  );

const isNoLongerFile = (filePath: string) =>
  fs.stat(filePath).then(
    (stats) => !stats.isFile(),
    () => true,
  );

/** The files that are gone from disk, a batch at a time */
async function filterGone(files: MediaFile[]): Promise<MediaFile[]> {
  const gone: MediaFile[] = [];
  for (let i = 0; i < files.length; i += STAT_BATCH_SIZE) {
    const batch = files.slice(i, i + STAT_BATCH_SIZE);
    const isBatchGone = await Promise.all(
      batch.map((file) => isNoLongerFile(file.path)),
    );
    gone.push(...batch.filter((_, j) => isBatchGone[j]));
  }

  return gone;
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
