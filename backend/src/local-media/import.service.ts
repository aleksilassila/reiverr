import { EntityManager } from '@mikro-orm/sqlite';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import { randomUUID } from 'node:crypto';
import * as path from 'path';
import { MediaType } from '../common/common.dto.js';
import {
  DownloadsService,
  ImportTarget,
} from '../downloads/downloads.service.js';
import { JobPayloads } from '../jobs/job-types.js';
import { JobContext, JobsService } from '../jobs/jobs.service.js';
import { INDEXED_FIELDS, LocalMediaService } from './local-media.service.js';
import {
  episodeFileName,
  seasonFolderName,
  seriesFolderName,
} from './local-media.utils.js';
import { MediaFile } from './media-file.entity.js';

// The length of the version label in the names of imported files
const VERSION_LABEL_LENGTH = 8;

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

/**
 * Puts the files that downloads finish into the library, as versions of
 * their episodes: the job `localMedia.importTorrentFile`
 */
@Injectable()
export class ImportService implements OnModuleInit {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly jobs: JobsService,
    private readonly localMediaService: LocalMediaService,
    private readonly downloadsService: DownloadsService,
  ) {}

  onModuleInit() {
    this.jobs.define('localMedia.importTorrentFile', {
      concurrency: 2,
      retry: true,
      // A library that was not mounted is noticed soon after it is again
      maxRetryDelay: 5 * 60 * 1000,
      run: (payload, context) => this.importTorrentFile(payload, context),
    });
  }

  /**
   * Places a finished file in the library for the requests that want it, and
   * gives it to them. A file that is not whole any more, or that nothing
   * wants, is left where it is: the torrent decides again when it is.
   */
  private async importTorrentFile(
    { torrentId, fileIndex }: JobPayloads['localMedia.importTorrentFile'],
    context: JobContext,
  ): Promise<void> {
    const target = await this.downloadsService.getImportTarget(
      torrentId,
      fileIndex,
    );
    if (!target) return;

    try {
      const placed = await this.placeEpisodeFile(target);
      await context.em.transactional(async (tx) => {
        await this.indexImportedFile(tx, placed);
        await this.downloadsService.fileImported(tx, {
          torrentId,
          mediaType: MediaType.Series,
          tmdbId: target.tmdbId,
        });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.downloadsService
        .importFailed(torrentId, fileIndex, message)
        .catch((reason: Error) =>
          this.logger.error(`Recording the failure failed: ${reason.message}`),
        );
      throw error;
    }
  }

  /**
   * Puts a video file into the library as the given episodes of a series,
   * as the version of the torrent it comes from. A rerun puts the file where
   * that version is already. The file is hard linked so it takes no extra
   * space, or copied when the source is on another filesystem. A file that
   * is there already counts only when it is the same file, which a rerun of
   * an import finds.
   */
  async placeEpisodeFile(target: ImportTarget): Promise<PlacedFile> {
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

    const { id } = await em.findOneOrFail(
      MediaFile,
      { path: file.path },
      { fields: ['id'], disableIdentityMap: true },
    );

    return id;
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

  /** The Jellyfin naming, under the title folder of the series or a new one */
  private async getImportPath(target: ImportTarget): Promise<string> {
    const { tmdbId, season, episodes, sourcePath, infoHash } = target;
    const { name, match } = await this.localMediaService.getSeriesMatch(tmdbId);
    const { seriesFolders } = await this.localMediaService.getSettings();
    if (!seriesFolders.length) {
      throw new Error('No series folder is configured');
    }

    const [titleFolder] = await this.localMediaService.findTitleFolders(
      seriesFolders,
      match,
    );

    return path.join(
      titleFolder ??
        path.join(seriesFolders[0], seriesFolderName(name, match.year, tmdbId)),
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
