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
import { RequestsService } from '../requests/requests.service.js';
import { LogType } from '../server-log/log-entry.entity.js';
import { ServerLogService } from '../server-log/server-log.service.js';
import { SettingsService } from '../settings/settings.service.js';
import {
  DeletedLibraryEntriesDto,
  LibraryEntryDto,
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

/**
 * A library folder that cannot be read, or that is empty while files are
 * indexed in it: taken for a disk that is not mounted, so nothing is forgotten
 * or written there. Routes answer it with 503.
 */
export class LibraryUnavailableError extends ServiceUnavailableException {}

// How soon a title that is looked at is synced with the disk
const SYNC_DELAY = 30_000;

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
    private readonly requestsService: RequestsService,
    private readonly jobs: JobsService,
    private readonly serverLog: ServerLogService,
  ) {}

  onModuleInit() {
    this.jobs.define('title.sync', {
      dropAtRestart: true,
      run: ({ mediaType, tmdbId }) => this.syncTitle(mediaType, tmdbId),
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
    const kept = new Set([...value.movieFolders, ...value.seriesFolders]);
    const removed = [...current.movieFolders, ...current.seriesFolders].filter(
      (folder) => !kept.has(folder),
    );
    const forgotten = (
      await Promise.all(removed.map((folder) => this.findFilesInside(folder)))
    ).flat();
    if (forgotten.length && !force) {
      throw new BadRequestException(
        `${forgotten.length} indexed files are in the folders that are removed. Removing them forgets the files, and their requests download them again`,
      );
    }
    if (forgotten.length) {
      await this.em.transactional(async (tx) => {
        const ids = forgotten.map((file) => file.id);
        await this.requestsService.enqueueTorrentsOfFiles(tx, ids);
        await tx.nativeDelete(MediaFile, { id: { $in: ids } });
      });
    }

    const saved = await this.settingsService.saveValue(SETTINGS_KEY, value);
    // Imports that wait for a folder that was missing or unreadable
    await this.jobs.runNow(this.em, 'torrent.import');

    return saved;
  }

  /**
   * The indexed files of a movie that are on disk, as of the last sync of the
   * title. Asks for a sync, at once when a file is missing.
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
   * sync of the title. Asks for a sync, at once when a file is missing.
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
    // A file that was put into the library by hand is indexed by a sync
    if (!files.length) await this.requestSync(MediaType.Series, tmdbId, 0);

    return files;
  }

  /**
   * Brings the index of a title in line with what is in its title folders:
   * the job `title.sync`
   */
  async syncTitle(mediaType: MediaType, tmdbId: string): Promise<void> {
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
        (file) => ({ ...file, season: 0, episode: 0, lastEpisode: 0 }),
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
      (file) => {
        const numbers = parseEpisodeNumbers(file.name);

        return numbers ? [{ ...file, ...toFileTarget(numbers) }] : [];
      },
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
    // In the order a walk of the folders finds them
    const indexed = (await this.findIndexedFiles(mediaType, tmdbId)).sort(
      (a, b) => a.path.localeCompare(b.path),
    );
    const settings = await this.getSettings();
    const folders =
      mediaType === MediaType.Movie
        ? settings.movieFolders
        : settings.seriesFolders;
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

    await this.requestSync(mediaType, tmdbId, isAnyMissing ? 0 : SYNC_DELAY);

    return files;
  }

  /**
   * Queues a sync of a title. The queued one keeps the earlier time, so a
   * title that is looked at all the time is synced once per delay.
   */
  private requestSync(mediaType: MediaType, tmdbId: string, delay: number) {
    return this.jobs.enqueue(
      this.em,
      'title.sync',
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
   * as the version of the torrent it comes from, at `destination` when it is
   * given. The file is hard linked so it takes no extra space, or copied when
   * the source is on another filesystem. A file that is there already counts
   * only when it is the same file, which a rerun of an import finds.
   */
  async placeEpisodeFile(
    options: ImportOptions & { destination?: string },
  ): Promise<PlacedFile> {
    const { tmdbId, season, episodes, sourcePath, infoHash } = options;
    const destination =
      options.destination ?? (await this.getImportPath(options));

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
      // A lookup of the series can have indexed the file already
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

  /** The indexed files of a title, as they were at its last lookup */
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

  /** The indexed files that were imported from a torrent */
  findVersions(mediaType: MediaType): Promise<MediaFile[]> {
    return this.em.find(
      MediaFile,
      { mediaType, infoHash: { $ne: null } },
      { disableIdentityMap: true },
    );
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
    await this.assertLibraryFolder(folder);
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
          path: path.relative(folder, entryPath).split(path.sep).join('/'),
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
        const forgotten = gone.filter((file) => present.has(file.id));
        if (forgotten.length) {
          await forget(tx, forgotten);
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
          path: path.relative(folder, entryPath).split(path.sep).join('/'),
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

  private async assertLibraryFolder(folder: string): Promise<void> {
    const { movieFolders, seriesFolders } = await this.getSettings();

    if (![...movieFolders, ...seriesFolders].includes(folder)) {
      throw new BadRequestException('Not a library folder');
    }
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
    await this.assertLibraryFolder(folder);
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
   * Brings the indexed files of a title in line with what was found on disk
   * and returns their ids by path. Files that are new to the index are not
   * managed. A file is forgotten when it is gone or no longer in a title
   * folder of the title. Managed files stay as they were imported, because
   * that is what a cleanup checks before it deletes one.
   */
  private async indexFiles(
    mediaType: MediaType,
    tmdbId: string,
    library: { folders: string[]; target: MediaMatchTarget },
    found: (FoundFile & FileTarget)[],
  ): Promise<Map<string, string>> {
    const indexed = await this.em.find(
      MediaFile,
      { mediaType, tmdbId },
      { disableIdentityMap: true },
    );
    const indexedByPath = new Map(indexed.map((file) => [file.path, file]));
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
      const stats = isOfTitle
        ? await fs.stat(file.path).catch(() => undefined)
        : undefined;
      if (!stats?.isFile()) gone.push(file);
    }
    const changed = found.filter((file) => {
      const current = indexedByPath.get(file.path);
      if (current?.managed) return false;

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
      await this.em.transactional(async (tx) => {
        const ids = gone.map((file) => file.id);
        // A request that had one of them downloads it again
        await this.requestsService.enqueueTorrentsOfFiles(tx, ids);
        await tx.nativeDelete(MediaFile, { id: { $in: ids } });
      });
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
        // Keeps the id and where the file came from, and a managed file of
        // another title as it was imported
        .onConflict('path')
        .merge([...INDEXED_FIELDS])
        .where({ managed: false })
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
      for (const entry of await this.readLibraryFolder(folder)) {
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

/** "EACCES: permission denied", without the system call and the path */
const describeError = (error: Error) => error.message.split(',')[0];

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
