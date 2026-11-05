import { EntityManager } from '@mikro-orm/sqlite';
import { Injectable, NotFoundException } from '@nestjs/common';
import { MediaType, Pair } from '../common/common.dto.js';
import { IndexersService } from '../indexers/indexers.service.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { hasEpisode, hasSeason } from '../metadata/metadata.utils.js';
import { RequestSource } from './request-source.entity.js';
import { MediaRequest } from './request.entity.js';
import { RequestsService } from './requests.service.js';
import { writeSource } from './requests.utils.js';

/** What a user picks a source for: a season (episode 0) or an episode of a series, or a movie (season and episode 0) */
export interface SelectionTarget extends Pair {
  season: number;
  episode: number;
}

/**
 * Where the requests of a user get their files: the release or the file the
 * user selected for a movie, a season or an episode. Every change reconciles
 * the requests of the pair and has the library look at the requests in scope.
 */
@Injectable()
export class RequestSourcesService {
  constructor(
    private readonly em: EntityManager,
    private readonly metadataService: MetadataService,
    private readonly indexersService: IndexersService,
    private readonly requestsService: RequestsService,
  ) {}

  /**
   * Makes a release the torrent that the requests of a user for an episode,
   * with episode 0 for a season, or for a movie get their files from. The
   * release is resolved now, so that a link that leads nowhere fails here,
   * and kept with its magnet link or .torrent file so that it can be
   * downloaded long after the search result has expired. A source is what
   * lets a request through the download-ahead gate, so the requests are
   * reconciled, and the library looks at the requests in scope.
   */
  async selectRelease(
    target: SelectionTarget,
    releaseId: string,
  ): Promise<void> {
    await this.assertTarget(target);

    const release = this.indexersService.getRelease(releaseId);
    if (!release) {
      throw new NotFoundException('Release not found, search again');
    }
    // Fetches the .torrent file, outside any transaction
    const torrent = await this.indexersService.resolveTorrent(release);

    await this.em.transactional(async (tx) => {
      await writeSource(tx, {
        ...target,
        kind: 'torrent',
        infoHash: torrent.infoHash,
        title: release.title,
        indexer: release.indexer,
        size: release.size,
        magnetUrl: release.magnetUrl ?? torrent.magnetUrl,
        torrentFile: torrent.torrentFile,
      });
      await this.sourceChanged(tx, target);
    });
  }

  /**
   * Makes a file in the library what the requests of a user for an episode
   * or a movie have. Whether the file is of the episode and in the library
   * is the library's to tell, when it looks at the request.
   */
  async selectFile(
    target: SelectionTarget,
    mediaFileId: string,
  ): Promise<void> {
    await this.assertTarget(target);

    await this.em.transactional(async (tx) => {
      await writeSource(tx, { ...target, kind: 'file', mediaFileId });
      await this.sourceChanged(tx, target);
    });
  }

  /**
   * Forgets the torrent a user selected for a season, or the torrent or the
   * file for an episode or a movie. An episode falls back to its season's
   * torrent.
   */
  async clearSelection(target: SelectionTarget): Promise<boolean> {
    const { userId, mediaType, tmdbId, season, episode } = target;

    return this.em.transactional(async (tx) => {
      const deleted = await tx.nativeDelete(RequestSource, {
        userId,
        mediaType,
        tmdbId,
        season,
        episode,
      });
      if (!deleted) return false;

      await this.sourceChanged(tx, target);

      return true;
    });
  }

  /** The movie, or the season or episode of the series, has to exist */
  private async assertTarget(target: SelectionTarget): Promise<void> {
    const { mediaType, tmdbId, season, episode } = target;
    if (mediaType === MediaType.Movie) {
      const movie = await this.metadataService.getMovieByTmdbId(tmdbId);
      if (!movie) throw new NotFoundException('Movie not found');
      return;
    }

    const series = await this.metadataService.getSeriesByTmdbId(tmdbId);
    if (!series) throw new NotFoundException('Series not found');

    const exists =
      episode === 0
        ? hasSeason(series.tmdbSeries, season)
        : hasEpisode(series.tmdbSeries, season, episode);
    if (!exists) throw new NotFoundException('Season or episode not found');
  }

  /** Reconciles the requests of the pair, and has the library look at the requests of the user in the scope of a source: the movie's, the season's or the episode's */
  private async sourceChanged(tx: EntityManager, target: SelectionTarget) {
    const { userId, mediaType, tmdbId, season, episode } = target;
    await this.requestsService.reconcileRequests(tx, target);
    const requests = await tx.find(
      MediaRequest,
      {
        userId,
        tmdbId,
        mediaType,
        season,
        ...(episode !== 0 && { episode }),
      },
      { disableIdentityMap: true, fields: ['id'] },
    );
    await this.requestsService.reconcileBindingsLater(
      tx,
      requests.map((request) => request.id),
    );
  }
}
