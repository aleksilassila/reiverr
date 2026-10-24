import { EntityManager } from '@mikro-orm/sqlite';
import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { randomUUID } from 'node:crypto';
import * as path from 'path';
import { MediaType } from '../common/common.dto.js';
import { LibraryService } from './library.service.js';
import {
  episodeFileName,
  libraryFolderPaths,
  primaryLibraryFolder,
  seasonFolderName,
  seriesFolderName,
} from './library.utils.js';
import { INDEXED_FIELDS, MediaFile } from './media-file.entity.js';

// The length of the version label in the names of imported files
const VERSION_LABEL_LENGTH = 8;

/** A complete file of a torrent, to put into the library */
export interface ImportTarget {
  sourcePath: string;
  /** The torrent the file comes from, which makes the file a version */
  infoHash: string;
  mediaType: MediaType;
  tmdbId: string;
  season: number;
  /** The episodes the file is, by its name or by what was wanted of it */
  episodes: number[];
}

/** A file that an import put into the library */
interface PlacedFile {
  path: string;
  tmdbId: string;
  season: number;
  episodes: number[];
  infoHash: string;
  size: number;
  modifiedAt: Date;
}

/** Puts the files that downloads finish into the library, as versions of their episodes */
@Injectable()
export class ImportService {
  constructor(
    private readonly em: EntityManager,
    private readonly libraryService: LibraryService,
  ) {}

  /**
   * Places a complete file in the library and indexes it as a managed
   * version. Importing the same file again changes nothing.
   */
  async importFile(target: ImportTarget): Promise<MediaFile> {
    if (target.mediaType !== MediaType.Series) {
      throw new Error('Movies cannot be imported yet');
    }

    const placed = await this.placeEpisodeFile(target);

    return this.em.transactional((tx) => this.indexImportedFile(tx, placed));
  }

  /**
   * Puts a video file into the library as the given episodes of a series,
   * as the version of the torrent it comes from. A rerun puts the file where
   * that version is already. The file is hard linked so it takes no extra
   * space, or copied when the source is on another filesystem. A file that
   * is there already counts only when it is the same file, which a rerun of
   * an import finds.
   */
  private async placeEpisodeFile(target: ImportTarget): Promise<PlacedFile> {
    const { tmdbId, season, episodes, sourcePath, infoHash } = target;
    const destination =
      (await this.findVersionPath(target)) ??
      (await this.getImportPath(target));

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

  /** Indexes a file that was put into the library as a managed version */
  private async indexImportedFile(
    em: EntityManager,
    file: PlacedFile,
  ): Promise<MediaFile> {
    await em
      .createQueryBuilder(MediaFile)
      .insert({
        id: randomUUID(),
        path: file.path,
        mediaType: MediaType.Series,
        tmdbId: file.tmdbId,
        season: file.season,
        episode: Math.min(...file.episodes),
        lastEpisode: Math.max(...file.episodes),
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

    return em.findOneOrFail(
      MediaFile,
      { path: file.path },
      { disableIdentityMap: true },
    );
  }

  /** Where the version of the torrent for the episodes is, when it was imported before */
  private async findVersionPath(
    target: ImportTarget,
  ): Promise<string | undefined> {
    const { tmdbId, season, episodes, infoHash } = target;
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

  /** The Jellyfin naming, under the title folder of the series or a new one in the primary folder */
  private async getImportPath(target: ImportTarget): Promise<string> {
    const { tmdbId, season, episodes, sourcePath, infoHash } = target;
    const { name, match } = await this.libraryService.getTitleMatch(
      MediaType.Series,
      tmdbId,
    );
    const { seriesFolders } = await this.libraryService.getSettings();
    const primaryFolder = primaryLibraryFolder(seriesFolders);
    if (!primaryFolder) {
      throw new Error('No series folder is configured');
    }

    const [titleFolder] = await this.libraryService.findTitleFolders(
      libraryFolderPaths(seriesFolders),
      match,
    );
    return path.join(
      titleFolder ??
        path.join(primaryFolder, seriesFolderName(name, match.year, tmdbId)),
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
}
