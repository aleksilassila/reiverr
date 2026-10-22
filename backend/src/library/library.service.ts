import { EntityManager } from '@mikro-orm/sqlite';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Dirent, promises as fs } from 'fs';
import { randomUUID } from 'node:crypto';
import * as path from 'path';
import { MediaType } from '../common/common.dto.js';
import { JobsService } from '../jobs/jobs.service.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { SettingsService } from '../settings/settings.service.js';
import {
  byName,
  entryExists,
  isDirectory,
  readDirectory,
  STAT_BATCH_SIZE,
} from './disk.utils.js';
import {
  CleanupSchedule,
  LibraryEntryDto,
  LibrarySettingsDto,
} from './library.dto.js';
import {
  describeError,
  folderMatchesTitle,
  isInsideFolder,
  TitleMatch,
  normalizeTitle,
  parseMediaFolderName,
  relativePath,
  yearOf,
} from './library.utils.js';
import { INDEXED_FIELDS, MediaFile } from './media-file.entity.js';
import { RequestBinding } from './request-binding.entity.js';

const SETTINGS_KEY = 'library';

const DEFAULT_SETTINGS: LibrarySettingsDto = {
  movieFolders: [],
  seriesFolders: [],
  cleanup: CleanupSchedule.Daily,
  maxDiskUsagePercent: null,
};

// SQLite limits the number of values in one statement
const INDEX_BATCH_SIZE = 500;

/** A file on disk with the title it belongs to, as a scan found it */
export type IndexableFile = Pick<
  MediaFile,
  | 'path'
  | 'tmdbId'
  | 'season'
  | 'episode'
  | 'lastEpisode'
  | 'size'
  | 'modifiedAt'
>;

/**
 * A library folder that cannot be read, or that is empty while files are
 * indexed in it: taken for a disk that is not mounted, so nothing is forgotten
 * or written there. Routes answer it with 503.
 */
export class LibraryUnavailableError extends ServiceUnavailableException {}

/**
 * The index of the library: its settings and folders, the rows of the
 * files that are on disk, and what an admin sees of a folder. The scans
 * bring the rows in line with the disk, the imports add to them, and the
 * playback serves them.
 */
@Injectable()
export class LibraryService {
  constructor(
    private readonly em: EntityManager,
    private readonly settingsService: SettingsService,
    private readonly metadataService: MetadataService,
    private readonly jobs: JobsService,
  ) {}

  getSettings(): Promise<LibrarySettingsDto> {
    return this.settingsService.getOrCreateValue(
      SETTINGS_KEY,
      DEFAULT_SETTINGS,
    );
  }

  /**
   * Sets the library folders, the cleanup schedule and the disk limit.
   * Removing a folder that has indexed files in it forgets them, and their
   * requests download them again, so it takes `forgetFiles`.
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
    const maxDiskUsagePercent = settings.maxDiskUsagePercent ?? null;
    if (
      maxDiskUsagePercent !== null &&
      !(
        typeof maxDiskUsagePercent === 'number' &&
        maxDiskUsagePercent >= 0 &&
        maxDiskUsagePercent <= 100
      )
    ) {
      throw new BadRequestException(
        'maxDiskUsagePercent must be null or a number from 0 to 100',
      );
    }
    const value: LibrarySettingsDto = {
      movieFolders: await this.validateFolders(settings.movieFolders),
      seriesFolders: await this.validateFolders(settings.seriesFolders),
      cleanup: settings.cleanup,
      maxDiskUsagePercent,
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
    // Requests held back by the limit may fit the new one
    if (current.maxDiskUsagePercent !== maxDiskUsagePercent) {
      await this.jobs.enqueue(this.em, 'library.sweepRequests', {});
    }

    return saved;
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

  /** What a library folder holds, movies or series */
  async getLibraryFolderType(folder: string): Promise<MediaType> {
    const { movieFolders, seriesFolders } = await this.getSettings();

    if (seriesFolders.includes(folder)) return MediaType.Series;
    if (movieFolders.includes(folder)) return MediaType.Movie;
    throw new BadRequestException('Not a library folder');
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

    const entries = await readDirectory(folder).catch((error) => {
      throw unavailable(describeError(error));
    });
    if (!entries.length && (await this.em.count(MediaFile, isInside(folder)))) {
      throw unavailable('it is empty, but files are indexed in it');
    }

    return entries;
  }

  /** The name of a title and what tells its folders, from the cached metadata */
  async getTitleMatch(
    mediaType: MediaType,
    tmdbId: string,
  ): Promise<{ name: string; match: TitleMatch }> {
    if (mediaType === MediaType.Movie) {
      const metadata = await this.metadataService.getMovieByTmdbId(tmdbId);
      if (!metadata) throw new NotFoundException('Movie not found');

      const movie = metadata.tmdbMovie;

      return {
        name: movie.title,
        match: {
          tmdbId,
          imdbId: movie.imdb_id ?? movie.external_ids?.imdb_id,
          titles: [movie.title, movie.original_title]
            .filter(Boolean)
            .map(normalizeTitle),
          year: yearOf(movie.release_date),
        },
      };
    }

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

  /** The folders of a title in the library folders, by their names */
  async findTitleFolders(
    folders: string[],
    match: TitleMatch,
  ): Promise<string[]> {
    const titleFolders: string[] = [];

    for (const folder of folders) {
      for (const entry of await this.readAvailableLibraryFolder(folder)) {
        if (!(await isDirectory(entry, folder))) continue;
        if (!folderMatchesTitle(parseMediaFolderName(entry.name), match))
          continue;

        titleFolders.push(path.join(folder, entry.name));
      }
    }

    return titleFolders;
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

  /** The indexed files of a title, as of its last scan */
  findFilesOfTitle(mediaType: MediaType, tmdbId: string): Promise<MediaFile[]> {
    return this.em.find(
      MediaFile,
      { mediaType, tmdbId },
      { disableIdentityMap: true },
    );
  }

  findFilesInside(dir: string): Promise<MediaFile[]> {
    return this.em.find(MediaFile, isInside(dir), { disableIdentityMap: true });
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
   * Writes the rows of the found files that are new or changed. A new row is
   * an external file. A row keeps its id and where the file came from, and a
   * managed row stays as it was imported, because that is what a cleanup
   * checks before it deletes the file.
   */
  async upsertFiles(
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

  /**
   * Forgets indexed files, and has the requests that had them looked at
   * again in the same transaction, so that they download the files again
   */
  async forgetFiles(files: MediaFile[]): Promise<void> {
    if (!files.length) return;

    await this.em.transactional(async (tx) => {
      await tx.nativeDelete(MediaFile, {
        id: { $in: files.map((file) => file.id) },
      });
      await this.filesForgotten(tx, files);
    });
  }

  /**
   * Has the requests that had files whose rows are deleted looked at again,
   * in the caller's transaction. Their bindings refer to the rows until the
   * reconcile lets go of what is not in the library, which is how they
   * download the files again.
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
    for (const { requestId } of bindings) {
      await this.jobs.enqueue(em, 'library.reconcileRequest', { requestId });
    }
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
}

/** The condition for the files inside a directory */
const isInside = (dir: string) => ({
  path: {
    $gte: dir + path.sep,
    // The character after the separator ends the range of what is inside
    $lt: dir + String.fromCharCode(path.sep.charCodeAt(0) + 1),
  },
});
