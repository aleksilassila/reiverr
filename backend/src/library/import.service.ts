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
  movieFileName,
  primaryLibraryFolder,
  seasonFolderName,
  subtitleFileName,
  titleFolderName,
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
  /** 0 for a movie */
  season: number;
  /** The episodes the file is, by its name or by what was wanted of it; [0] for a movie */
  episodes: number[];
  /** The subtitle files of the torrent that belong to the file, placed next to it */
  subtitles: { sourcePath: string; name: string }[];
}

/** A file that an import put into the library */
interface PlacedFile {
  path: string;
  mediaType: MediaType;
  tmdbId: string;
  season: number;
  episodes: number[];
  infoHash: string;
  size: number;
  modifiedAt: Date;
}

/** Puts the files that downloads finish into the library, as versions of their movies and episodes */
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
    const placed = await this.placeVersion(target);

    return this.em.transactional((tx) => this.indexImportedFile(tx, placed));
  }

  /**
   * Puts a video file into the library as the version of the torrent it
   * comes from, of a movie or of the given episodes of a series, with its
   * subtitles as sidecars named after it. A rerun puts the files where that
   * version is already.
   */
  private async placeVersion(target: ImportTarget): Promise<PlacedFile> {
    const { mediaType, tmdbId, season, episodes, sourcePath, infoHash } =
      target;
    const destination =
      (await this.findVersionPath(target)) ??
      (await this.getImportPath(target));

    await fs.mkdir(path.dirname(destination), { recursive: true });
    await this.placeFile(sourcePath, destination);
    const stats = await fs.stat(destination);

    // Two subtitles of the torrent with one name give the first sidecar only
    const sidecars = new Set<string>();
    for (const subtitle of target.subtitles) {
      const sidecar = path.join(
        path.dirname(destination),
        subtitleFileName(
          path.basename(destination),
          path.basename(sourcePath),
          subtitle.name,
        ),
      );
      if (sidecars.has(sidecar)) continue;
      sidecars.add(sidecar);
      await this.placeFile(subtitle.sourcePath, sidecar);
    }

    return {
      path: destination,
      mediaType,
      tmdbId,
      season,
      episodes,
      infoHash,
      size: stats.size,
      modifiedAt: stats.mtime,
    };
  }

  /**
   * Hard links a file to where it goes, so that it takes no extra space, or
   * copies it when the source is on another filesystem. A file that is
   * there already counts only when it is the same file, which a rerun of an
   * import finds.
   */
  private async placeFile(
    sourcePath: string,
    destination: string,
  ): Promise<void> {
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
        mediaType: file.mediaType,
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
      // A scan of the title or of its folder can have indexed the file already
      .onConflict('path')
      .merge([...INDEXED_FIELDS, 'infoHash', 'managed'])
      .execute();

    return em.findOneOrFail(
      MediaFile,
      { path: file.path },
      { disableIdentityMap: true },
    );
  }

  /** Where the version of the torrent for the movie or the episodes is, when it was imported before */
  private async findVersionPath(
    target: ImportTarget,
  ): Promise<string | undefined> {
    const { mediaType, tmdbId, season, episodes, infoHash } = target;
    const version = await this.em.findOne(
      MediaFile,
      {
        mediaType,
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

  /**
   * The Jellyfin naming, under the title folder of the movie or the series,
   * or a new one in the primary folder of its type
   */
  private async getImportPath(target: ImportTarget): Promise<string> {
    const { mediaType, tmdbId, season, episodes, sourcePath, infoHash } =
      target;
    const { name, match } = await this.libraryService.getTitleMatch(
      mediaType,
      tmdbId,
    );
    const settings = await this.libraryService.getSettings();
    const folders =
      mediaType === MediaType.Movie
        ? settings.movieFolders
        : settings.seriesFolders;
    const primaryFolder = primaryLibraryFolder(folders);
    if (!primaryFolder) {
      throw new Error(`No ${mediaType} folder is configured`);
    }

    const [titleFolder] = await this.libraryService.findTitleFolders(
      libraryFolderPaths(folders),
      match,
    );
    const folder =
      titleFolder ??
      path.join(primaryFolder, titleFolderName(name, match.year, tmdbId));
    const label = infoHash.slice(0, VERSION_LABEL_LENGTH);
    const extension = path.extname(sourcePath);

    if (mediaType === MediaType.Movie) {
      return path.join(
        folder,
        movieFileName(name, match.year, label, extension),
      );
    }
    return path.join(
      folder,
      seasonFolderName(season),
      episodeFileName(name, season, episodes, label, extension),
    );
  }
}
