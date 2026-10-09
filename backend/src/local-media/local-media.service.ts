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
  DeletedLibraryEntriesDto,
  LibraryEntryDto,
  LibraryScanDto,
  LocalEpisodeFileDto,
  LocalMediaFileDto,
  LocalMediaSettingsDto,
  LocalSubtitleFileDto,
} from './local-media.dto.js';
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

// How many files of a library folder are looked at at a time
const STAT_BATCH_SIZE = 64;

interface FoundFile {
  path: string;
  name: string;
  size: number;
  modifiedAt: Date;
  subtitles: LocalSubtitleFileDto[];
}

/**
 * Runs in the transaction that forgets indexed files, before their rows go,
 * for whatever refers to them
 */
export type ForgetHook = (
  tx: EntityManager,
  files: MediaFile[],
) => Promise<void>;

interface ImportOptions {
  tmdbId: string;
  season: number;
  episodes: number[];
  sourcePath: string;
  infoHash: string;
}

/** A file that an import put into the library */
export interface PlacedFile {
  path: string;
  tmdbId: string;
  season: number;
  episodes: number[];
  infoHash: string;
  size: number;
  modifiedAt: Date;
}

/** What a file is, as far as its name tells */
type FileTarget = Pick<MediaFile, 'season' | 'episode' | 'lastEpisode'>;

/** A file on disk with the title it belongs to */
type IndexableFile = FoundFile & FileTarget & { tmdbId: string };

/**
 * A library folder that cannot be read, or that is empty while files are
 * indexed in it: taken for a disk that is not mounted, so nothing is forgotten
 * or written there. Routes answer it with 503.
 */
export class LibraryUnavailableError extends ServiceUnavailableException {}

// How soon a title that is looked at is scanned
const SCAN_DELAY = 30_000;

/** Whether a file is still the one that was imported, as its row has it */
export const isStillImported = (
  file: Pick<MediaFile, 'size' | 'modifiedAt'>,
  stats: { isFile(): boolean; size: number; mtime: Date },
) =>
  stats.isFile() &&
  stats.size === file.size &&
  stats.mtime.getTime() === file.modifiedAt.getTime();

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

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
export class LocalMediaService implements OnModuleInit {
  private readonly logger = new Logger(LocalMediaService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly settingsService: SettingsService,
    private readonly metadataService: MetadataService,
    private readonly tmdbService: TmdbService,
    private readonly jobs: JobsService,
    private readonly serverLog: ServerLogService,
  ) {}

  onModuleInit() {
    this.jobs.define('localMedia.scanTitle', {
      dropAtRestart: true,
      run: ({ mediaType, tmdbId }) => this.scanTitle(mediaType, tmdbId),
    });
    // A scan that did not run at 04:00 waits for the next one
    this.jobs.define('localMedia.scanFolder', {
      dropAtRestart: true,
      run: ({ folder }) => this.scanAtNight(folder),
    });
  }

  getSettings(): Promise<LocalMediaSettingsDto> {
    return this.settingsService.getOrCreateValue(
      SETTINGS_KEY,
      DEFAULT_SETTINGS,
    );
  }

  /**
   * Sets the library folders. Removing a folder that has indexed files in it
   * forgets them, and their requests download them again, so it takes
   * `force`.
   */
  async updateSettings(
    settings: LocalMediaSettingsDto,
    force = false,
  ): Promise<LocalMediaSettingsDto> {
    const value: LocalMediaSettingsDto = {
      movieFolders: await this.resolveFolders(settings.movieFolders),
      seriesFolders: await this.resolveFolders(settings.seriesFolders),
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
    if (forgotten.length && !force) {
      throw new BadRequestException(
        `${forgotten.length} indexed files are in the folders that are removed. Removing them forgets the files, and their requests download them again`,
      );
    }
    await this.forgetFiles(forgotten);

    const saved = await this.settingsService.saveValue(SETTINGS_KEY, value);
    // Imports that wait for a folder that was missing or unreadable
    await this.jobs.runNow(this.em, 'localMedia.importTorrentFile');

    return saved;
  }

  /**
   * The indexed files of a movie that are on disk, as of the last scan of the
   * title. Asks for a scan, at once when a file is missing.
   */
  async getMovieFiles(tmdbId: string): Promise<LocalMediaFileDto[]> {
    const files = await this.readIndexedFiles(MediaType.Movie, tmdbId);

    return files.map(({ file, size, subtitles }) => ({
      id: file.id,
      fileName: path.basename(file.path),
      size,
      subtitles,
    }));
  }

  /**
   * The indexed episode files of a series that are on disk, as of the last
   * scan of the title. Asks for a scan, at once when a file is missing.
   */
  async getSeriesFiles(tmdbId: string): Promise<LocalEpisodeFileDto[]> {
    const files = await this.readIndexedFiles(MediaType.Series, tmdbId);

    return files.map(({ file, size, subtitles }) => {
      const fileName = path.basename(file.path);
      const numbers = parseEpisodeNumbers(fileName);

      return {
        id: file.id,
        fileName,
        size,
        subtitles,
        season: file.season,
        episodes:
          numbers?.season === file.season
            ? numbers.episodes
            : range(file.episode, file.lastEpisode),
      };
    });
  }

  async getEpisodeFiles(
    tmdbId: string,
    season: number,
    episode: number,
  ): Promise<LocalEpisodeFileDto[]> {
    const files = (await this.getSeriesFiles(tmdbId)).filter(
      (file) => file.season === season && file.episodes.includes(episode),
    );
    // A file that was put into the library by hand is indexed by a scan
    if (!files.length) await this.requestScan(MediaType.Series, tmdbId, 0);

    return files;
  }

  /**
   * Brings the index of a title in line with what is in its title folders:
   * the job `localMedia.scanTitle`
   */
  async scanTitle(mediaType: MediaType, tmdbId: string): Promise<void> {
    const { movieFolders, seriesFolders } = await this.getSettings();

    if (mediaType === MediaType.Movie) {
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
      const found = (await this.findFiles(movieFolders, target)).map(
        toMovieFile,
      );
      await this.indexFiles(
        MediaType.Movie,
        tmdbId,
        { folders: movieFolders, target },
        found,
      );
      return;
    }

    const { target } = await this.getSeriesTarget(tmdbId);
    const found = (await this.findFiles(seriesFolders, target)).flatMap(
      toEpisodeFile,
    );
    await this.indexFiles(
      MediaType.Series,
      tmdbId,
      { folders: seriesFolders, target },
      found,
    );
  }

  /** The indexed files of a title that are files in a library folder */
  private async readIndexedFiles(mediaType: MediaType, tmdbId: string) {
    const settings = await this.getSettings();
    const folders =
      mediaType === MediaType.Movie
        ? settings.movieFolders
        : settings.seriesFolders;
    // In the order of the library folders, which decides the version that
    // plays first, and by path within one
    const folderOf = (file: MediaFile) =>
      folders.findIndex((folder) => isInsideFolder(file.path, folder));
    const indexed = (await this.findIndexedFiles(mediaType, tmdbId)).sort(
      (a, b) => folderOf(a) - folderOf(b) || a.path.localeCompare(b.path),
    );
    // A folder that is not mounted does not read as missing files
    for (const folder of folders) {
      if (indexed.some((file) => isInsideFolder(file.path, folder))) {
        await this.readLibraryFolder(folder);
      }
    }

    const directories = new Map<string, Dirent[]>();
    const files: {
      file: MediaFile;
      size: number;
      subtitles: LocalSubtitleFileDto[];
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

    await this.requestScan(mediaType, tmdbId, isAnyMissing ? 0 : SCAN_DELAY);

    return files;
  }

  /**
   * Queues a scan of a title. The queued one keeps the earlier time, so a
   * title that is looked at all the time is scanned once per delay.
   */
  private requestScan(mediaType: MediaType, tmdbId: string, delay: number) {
    return this.jobs.enqueue(
      this.em,
      'localMedia.scanTitle',
      { mediaType, tmdbId },
      { runAt: new Date(Date.now() + delay) },
    );
  }

  /**
   * Adds a video file to the library as the given episodes of a series, as
   * the version of the torrent it comes from, and indexes it
   */
  async importEpisodeFile(options: ImportOptions): Promise<string> {
    const placed = await this.placeEpisodeFile(options);
    await this.em.transactional((tx) => this.indexImportedFile(tx, placed));

    return placed.path;
  }

  /**
   * Puts a video file into the library as the given episodes of a series,
   * as the version of the torrent it comes from. A rerun puts the file where
   * that version is already. The file is hard linked so it takes no extra
   * space, or copied when the source is on another filesystem. A file that
   * is there already counts only when it is the same file, which a rerun of
   * an import finds.
   */
  async placeEpisodeFile(options: ImportOptions): Promise<PlacedFile> {
    const { tmdbId, season, episodes, sourcePath, infoHash } = options;
    const destination =
      (await this.findVersionPath(options)) ??
      (await this.getImportPath(options));

    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.link(sourcePath, destination).catch(async (error) => {
      if (error.code === 'EEXIST') {
        const [source, there] = await Promise.all([
          fs.stat(sourcePath),
          fs.stat(destination),
        ]);
        const isSame =
          (source.dev === there.dev && source.ino === there.ino) ||
          source.size === there.size;
        if (isSame) return;

        throw new Error(`Another file is at "${destination}"`);
      }

      // A file that is still being copied must not look like an episode
      const partial = `${destination}.partial`;
      await fs.copyFile(sourcePath, partial);
      await fs.rename(partial, destination);
    });

    const stats = await fs.stat(destination);

    return {
      path: destination,
      tmdbId,
      season,
      episodes,
      infoHash,
      size: stats.size,
      modifiedAt: stats.mtime,
    };
  }

  /**
   * Indexes a file that was put into the library as a managed version, with
   * the entity manager of the caller's transaction, and returns its id
   */
  async indexImportedFile(
    em: EntityManager,
    file: PlacedFile,
  ): Promise<string> {
    await em
      .createQueryBuilder(MediaFile)
      .insert({
        id: randomUUID(),
        path: file.path,
        mediaType: MediaType.Series,
        tmdbId: file.tmdbId,
        ...toFileTarget(file),
        size: file.size,
        modifiedAt: file.modifiedAt,
        infoHash: file.infoHash,
        managed: true,
        createdAt: new Date(),
      })
      // A scan of the series or of its folder can have indexed the file already
      .onConflict('path')
      .merge([...INDEXED_FIELDS, 'infoHash', 'managed'])
      .execute();

    const { id } = await em.findOneOrFail(
      MediaFile,
      { path: file.path },
      { fields: ['id'], disableIdentityMap: true },
    );

    return id;
  }

  /** Where the version of the torrent for the episodes is, when it was imported before */
  private async findVersionPath(
    options: ImportOptions,
  ): Promise<string | undefined> {
    const { tmdbId, season, episodes, infoHash } = options;
    const version = await this.em.findOne(
      MediaFile,
      {
        mediaType: MediaType.Series,
        tmdbId,
        season,
        episode: Math.min(...episodes),
        lastEpisode: Math.max(...episodes),
        infoHash,
        managed: true,
      },
      { fields: ['path'], disableIdentityMap: true },
    );

    return version?.path;
  }

  private async getImportPath(options: ImportOptions): Promise<string> {
    const { tmdbId, season, episodes, sourcePath, infoHash } = options;
    const { name, target } = await this.getSeriesTarget(tmdbId);
    const { seriesFolders } = await this.getSettings();
    if (!seriesFolders.length) {
      throw new Error('No series folder is configured');
    }

    const [titleFolder] = await this.findTitleFolders(seriesFolders, target);

    return path.join(
      titleFolder ??
        path.join(
          seriesFolders[0],
          seriesFolderName(name, target.year, tmdbId),
        ),
      seasonFolderName(season),
      episodeFileName(
        name,
        season,
        episodes,
        infoHash.slice(0, VERSION_LABEL_LENGTH),
        path.extname(sourcePath),
      ),
    );
  }

  /** The indexed files of a title, as of its last scan */
  findIndexedFiles(mediaType: MediaType, tmdbId: string): Promise<MediaFile[]> {
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
   * Deletes an imported file from the library, with the folders that it
   * leaves empty, and logs it with the reason. A file that is not what was
   * imported, or that the library folders no longer contain, is kept and
   * becomes an external file. `forget` runs in the transaction that forgets
   * the row.
   */
  async deleteManagedFile(
    id: string,
    reason: string,
    forget: ForgetHook = async () => {},
  ): Promise<void> {
    const file = await this.findFile(id);
    if (!file.managed) throw new Error(`"${file.path}" is not managed`);

    const { movieFolders, seriesFolders } = await this.getSettings();
    const libraryFolder = [...movieFolders, ...seriesFolders].find((folder) =>
      isInsideFolder(file.path, folder),
    );

    const stats = await fs.stat(file.path).catch(() => undefined);
    if (!stats) {
      // The file is only known to be gone when its folder can be read
      if (libraryFolder) await this.readLibraryFolder(libraryFolder);
      await this.em.transactional(async (tx) => {
        await forget(tx, [file]);
        const deleted = await tx.nativeDelete(MediaFile, { id });
        if (deleted) {
          await this.logDeleted(
            tx,
            file.path,
            `${reason}, it was gone already`,
            file,
          );
        }
      });
      return;
    }

    if (!libraryFolder || !isStillImported(file, stats)) {
      this.logger.warn(`"${file.path}" is not as imported, it is kept`);
      await this.em.nativeUpdate(MediaFile, { id }, { managed: false });
      return;
    }

    // An admin can have deleted it meanwhile
    await fs.unlink(file.path).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
    await this.em.transactional(async (tx) => {
      await forget(tx, [file]);
      const deleted = await tx.nativeDelete(MediaFile, { id });
      if (deleted) await this.logDeleted(tx, file.path, reason, file);
    });

    for (
      let folder = path.dirname(file.path);
      isInsideFolder(folder, libraryFolder);
      folder = path.dirname(folder)
    ) {
      // Fails for a folder that still has something in it
      const removed = await fs.rmdir(folder).then(
        () => true,
        () => false,
      );
      if (!removed) break;
    }
  }

  /**
   * Everything in a library folder: its directories and files with their
   * sizes, a directory before what is in it. Symbolic links are listed, not
   * followed. A file that is indexed says so.
   */
  async getLibraryEntries(folder: string): Promise<LibraryEntryDto[]> {
    await this.getLibraryFolderType(folder);
    await this.readLibraryFolder(folder);

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
   * What a scan of a library folder would forget: the indexed files that are
   * not on disk, or all of them when the folder is not available.
   */
  async previewScan(
    folder: string,
  ): Promise<{ available: boolean; reason?: string; missing: MediaFile[] }> {
    await this.getLibraryFolderType(folder);
    const indexed = await this.findFilesInside(folder);
    const reason = await this.readLibraryFolder(folder).then(
      () => undefined,
      (error) => {
        if (!(error instanceof LibraryUnavailableError)) throw error;
        return error.message;
      },
    );
    if (reason) return { available: false, reason, missing: indexed };

    return { available: true, missing: await findGone(indexed) };
  }

  /**
   * Brings the index of a library folder in line with the disk: new video
   * files get external rows, changed ones are updated and the ones that are
   * gone are forgotten, which makes their requests download them again. A
   * folder that is not available is only scanned when forced: it is read as
   * it is, so everything that was indexed in it is forgotten.
   */
  async scanFolder(
    folder: string,
    options: { force?: boolean } = {},
  ): Promise<LibraryScanDto> {
    const mediaType = await this.getLibraryFolderType(folder);
    // Read before the walk, so that a file indexed meanwhile is not taken for gone
    const indexed = await this.findFilesInside(folder);
    const entries = options.force
      ? await this.readDirectory(folder).catch((): Dirent[] => [])
      : await this.readLibraryFolder(folder);

    const result: LibraryScanDto = {
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

      const tmdbId = await this.resolveTitleFolder(
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
    const gone = await findGone(
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
   * The nightly scan of a library folder: the job `localMedia.scanFolder`. A
   * folder that is not available is left as it is and the failure is logged:
   * it is only scanned by hand.
   */
  private async scanAtNight(folder: string): Promise<void> {
    const { movieFolders, seriesFolders } = await this.getSettings();
    // Removed from the library since the job was queued
    if (![...movieFolders, ...seriesFolders].includes(folder)) return;

    let result: LibraryScanDto;
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

  /** The indexed files that are among the given entries of a library folder */
  async findLibraryFiles(
    folder: string,
    paths: string[],
  ): Promise<MediaFile[]> {
    const files: MediaFile[] = [];
    for (const entryPath of await this.resolveLibraryEntries(folder, paths)) {
      files.push(...(await this.findFilesAt(entryPath)));
    }

    return files;
  }

  /**
   * Deletes entries of a library folder, a directory with everything in it,
   * and forgets the indexed files among them. Nothing else is removed: a
   * directory that this leaves empty stays. An entry that cannot be deleted,
   * or only in part, is reported and the others are deleted anyway. Every
   * deletion is logged with the reason.
   */
  async deleteLibraryEntries(
    folder: string,
    paths: string[],
    reason: string,
    forget: ForgetHook = async () => {},
  ): Promise<DeletedLibraryEntriesDto & { files: MediaFile[] }> {
    const result: DeletedLibraryEntriesDto & { files: MediaFile[] } = {
      deleted: 0,
      failed: [],
      files: [],
    };

    for (const entryPath of await this.resolveLibraryEntries(folder, paths)) {
      const files = await this.findFilesAt(entryPath);
      // A cleanup can delete files of the entry meanwhile
      const existed = await exists(entryPath);
      const error = await fs
        .rm(entryPath, { recursive: true, force: true })
        .then(
          () => undefined,
          (error) => error,
        );

      // What is gone is gone, whether the deletion got through or not
      const gone: MediaFile[] = [];
      for (const file of files) {
        if (!(await exists(file.path))) gone.push(file);
      }
      const isEntryGone =
        existed &&
        !gone.some((file) => file.path === entryPath) &&
        !(await exists(entryPath));
      await this.em.transactional(async (tx) => {
        // The rows that a cleanup did not forget meanwhile
        const present = new Set(
          (
            await tx.find(
              MediaFile,
              { id: { $in: gone.map((file) => file.id) } },
              { fields: ['id'], disableIdentityMap: true },
            )
          ).map((file) => file.id),
        );
        // The caller acts on every file that is gone, also one whose row a
        // scan forgot while the rm ran
        if (gone.length) await forget(tx, gone);
        const forgotten = gone.filter((file) => present.has(file.id));
        if (forgotten.length) {
          await tx.nativeDelete(MediaFile, {
            id: { $in: forgotten.map((file) => file.id) },
          });
        }
        for (const file of forgotten) {
          await this.logDeleted(tx, file.path, reason, file);
        }
        if (isEntryGone) await this.logDeleted(tx, entryPath, reason);
      });

      result.files.push(...gone);
      if (error) {
        result.failed.push({
          path: relativePath(folder, entryPath),
          error: describeError(error),
        });
      } else {
        result.deleted++;
      }
    }

    return result;
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

  /** What a library folder holds, movies or series */
  private async getLibraryFolderType(folder: string): Promise<MediaType> {
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
  private async resolveTitleFolder(
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
      folderMatchesTarget(parsed, {
        tmdbId: result.tmdbId,
        titles: result.titles.filter(Boolean).map(normalizeTitle),
        year: yearOf(result.date),
      }),
    )?.tmdbId;
  }

  /**
   * The absolute paths of entries of a library folder that exist, without the
   * ones that are inside another one of them. An entry is something inside
   * the folder that no symbolic link leads to.
   */
  private async resolveLibraryEntries(
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

      const exists = await fs.lstat(entryPath).then(
        () => true,
        () => false,
      );
      if (!exists) continue;

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
  private async findFilesAt(entryPath: string): Promise<MediaFile[]> {
    const file = await this.em.findOne(
      MediaFile,
      { path: entryPath },
      { disableIdentityMap: true },
    );

    return file ? [file] : this.findFilesInside(entryPath);
  }

  private findFilesInside(dir: string): Promise<MediaFile[]> {
    return this.em.find(MediaFile, isInside(dir), { disableIdentityMap: true });
  }

  private logDeleted(
    em: EntityManager,
    filePath: string,
    reason: string,
    file?: MediaFile,
  ) {
    return this.serverLog.writeIn(
      em,
      LogType.FileDeleted,
      `Deleted "${filePath}": ${reason}`,
      {
        path: filePath,
        ...(file && {
          size: file.size,
          mediaType: file.mediaType,
          tmdbId: file.tmdbId,
          season: file.season,
          episode: file.episode,
          lastEpisode: file.lastEpisode,
          infoHash: file.infoHash,
        }),
      },
    );
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
  private async indexFiles(
    mediaType: MediaType,
    tmdbId: string,
    library: { folders: string[]; target: MediaMatchTarget },
    found: (FoundFile & FileTarget)[],
  ): Promise<void> {
    const indexed = await this.findIndexedFiles(mediaType, tmdbId);
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
        folderMatchesTarget(parseMediaFolderName(titleFolder), library.target);
      if (!isOfTitle || (await isGone(file.path))) gone.push(file);
    }

    await this.forgetFiles(gone);
    await this.upsertFiles(
      mediaType,
      found.map((file) => ({ ...file, tmdbId })),
      indexed,
    );
  }

  /**
   * Forgets indexed files. Their titles are reconciled in the same
   * transaction: a request that referred to one downloads it again.
   */
  private async forgetFiles(files: MediaFile[]): Promise<void> {
    if (!files.length) return;

    await this.em.transactional(async (tx) => {
      await tx.nativeDelete(MediaFile, {
        id: { $in: files.map((file) => file.id) },
      });
      await this.enqueueReconcile(tx, files);
    });
  }

  /** Has the titles of the files reconciled, once per title */
  private async enqueueReconcile(em: EntityManager, files: MediaFile[]) {
    const titles = new Map(
      files.map((file) => [
        `${file.mediaType}/${file.tmdbId}`,
        { mediaType: file.mediaType, tmdbId: file.tmdbId },
      ]),
    );
    for (const title of titles.values()) {
      await this.jobs.enqueue(em, 'downloads.reconcileTitle', title);
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
      for (const entry of await this.readLibraryFolder(folder)) {
        if (!(await this.isDirectory(entry, folder))) continue;
        if (!folderMatchesTarget(parseMediaFolderName(entry.name), target))
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
  private async readLibraryFolder(folder: string): Promise<Dirent[]> {
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

const exists = (filePath: string) =>
  fs.lstat(filePath).then(
    () => true,
    () => false,
  );

/** Whether an indexed file is no longer a file at its path */
const isGone = (filePath: string) =>
  fs.stat(filePath).then(
    (stats) => !stats.isFile(),
    () => true,
  );

/** The files that are gone from disk, a batch at a time */
async function findGone(files: MediaFile[]): Promise<MediaFile[]> {
  const gone: MediaFile[] = [];
  for (let i = 0; i < files.length; i += STAT_BATCH_SIZE) {
    const batch = files.slice(i, i + STAT_BATCH_SIZE);
    const isBatchGone = await Promise.all(
      batch.map((file) => isGone(file.path)),
    );
    gone.push(...batch.filter((_, j) => isBatchGone[j]));
  }

  return gone;
}

/** "EACCES: permission denied", without the system call and the path */
const describeError = (error: Error) => error.message.split(',')[0];

/** A path in a library folder as the API gives it, with / between the names */
const relativePath = (folder: string, entryPath: string) =>
  path.relative(folder, entryPath).split(path.sep).join('/');

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

/** The episodes a video is by its name, or nothing for a video that is not one */
function toEpisodeFile(file: FoundFile): (FoundFile & FileTarget)[] {
  const numbers = parseEpisodeNumbers(file.name);

  return numbers ? [{ ...file, ...toFileTarget(numbers) }] : [];
}

function toMovieFile(file: FoundFile): FoundFile & FileTarget {
  return { ...file, season: 0, episode: 0, lastEpisode: 0 };
}
