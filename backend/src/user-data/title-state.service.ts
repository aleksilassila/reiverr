import { CreateRequestContext } from '@mikro-orm/decorators/legacy';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/sqlite';
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { MediaType, Pair, Title } from '../common/common.dto.js';
import { MetadataService } from '../metadata/metadata.service.js';
import { PlayState } from './play-state.entity.js';
import { nextOf, TitleDocument } from './next-episode.js';
import { TitleState } from './title-state.entity.js';

const READ = { disableIdentityMap: true };

/**
 * The rows of what users have with titles: the list, the last play, and
 * the next episode stamped from the cached document and the play states,
 * which the my list page filters by
 */
@Injectable()
export class TitleStateService {
  private readonly logger = new Logger(TitleStateService.name);

  constructor(
    @InjectRepository(TitleState)
    private readonly repository: EntityRepository<TitleState>,
    private readonly em: EntityManager,
    private readonly metadataService: MetadataService,
  ) {}

  async findByTmdbId(
    userId: string,
    tmdbId: string,
    mediaType: MediaType,
  ): Promise<TitleState | null> {
    return this.repository.findOne({ userId, tmdbId, mediaType });
  }

  /** Lists the title and stamps what the user would watch next of it */
  async addToMyList(
    userId: string,
    tmdbId: string,
    mediaType: MediaType,
  ): Promise<void> {
    // Cached before the transaction, which the stamp reads the cache in
    await this.fetch({ mediaType, tmdbId });

    await this.em.transactional(async (tx) => {
      const pair = { userId, mediaType, tmdbId };
      const state = await this.getOrCreate(tx, pair);
      if (!state.addedToMyListAt) {
        await tx.nativeUpdate(
          TitleState,
          { id: state.id },
          { addedToMyListAt: new Date() },
        );
      }
      await this.stamp(tx, pair);
    });
  }

  /** Takes the title off the list; the row keeps what else it has. Whether it was listed */
  async removeFromMyList(
    userId: string,
    tmdbId: string,
    mediaType: MediaType,
  ): Promise<boolean> {
    const changed = await this.repository.nativeUpdate(
      { userId, tmdbId, mediaType, addedToMyListAt: { $ne: null } },
      { addedToMyListAt: null },
    );

    return changed > 0;
  }

  /** The user played something of the title, in the caller's transaction */
  async played(em: EntityManager, pair: Pair, at: Date): Promise<void> {
    const state = await this.getOrCreate(em, pair);
    await em.nativeUpdate(TitleState, { id: state.id }, { lastPlayedAt: at });
  }

  /**
   * Stamps what the user would watch next of the title, in the caller's
   * transaction, from the cached document and the play states. A title
   * whose document is not cached keeps its stamp
   */
  async stamp(em: EntityManager, pair: Pair): Promise<void> {
    const document = await this.findCached(em, pair);
    if (!document) return;

    const state = await this.getOrCreate(em, pair);
    await this.write(em, state.id, pair, document);
  }

  /**
   * Stamps every row again, at boot and once a night: a refreshed document
   * may have an episode after the one stamped, and the rows of an older
   * version have no stamp. The documents are refreshed on the way, each
   * read once for the rows of its title
   */
  @CreateRequestContext()
  async stampAll(): Promise<void> {
    const rows = await this.repository.findAll({
      ...READ,
      fields: ['id', 'userId', 'mediaType', 'tmdbId'],
    });
    const byTitle = new Map<string, typeof rows>();
    for (const row of rows) {
      const key = `${row.mediaType}:${row.tmdbId}`;
      byTitle.set(key, [...(byTitle.get(key) ?? []), row]);
    }

    for (const states of byTitle.values()) {
      const { mediaType, tmdbId } = states[0];
      const document = await this.fetch({ mediaType, tmdbId }, true).catch(
        (e) => {
          this.logger.warn(
            `Failed to fetch ${mediaType} ${tmdbId} for its next episode: ${e.message}`,
          );
          return undefined;
        },
      );
      if (!document) continue;

      for (const state of states) {
        await this.write(this.em, state.id, state, document);
      }
    }
  }

  /** The row of the pair, created when missing. Two first writes both create it */
  private async getOrCreate(
    em: EntityManager,
    pair: Pair,
  ): Promise<TitleState> {
    await em
      .createQueryBuilder(TitleState)
      .insert({ id: randomUUID(), ...pair, createdAt: new Date() })
      .onConflict(['userId', 'mediaType', 'tmdbId'])
      .ignore()
      .execute();

    return em.findOneOrFail(TitleState, pair);
  }

  private async write(
    em: EntityManager,
    id: string,
    pair: Pair,
    document: TitleDocument,
  ): Promise<void> {
    const playStates = await em.find(
      PlayState,
      { userId: pair.userId, mediaType: pair.mediaType, tmdbId: pair.tmdbId },
      READ,
    );
    const next = nextOf(document, playStates);

    await em.nativeUpdate(
      TitleState,
      { id },
      {
        nextSeason: next?.season ?? null,
        nextEpisode: next?.episode ?? null,
        nextAirDate: next?.airDate ?? null,
      },
    );
  }

  /** The cached document of the title, read in the caller's entity manager */
  private async findCached(
    em: EntityManager,
    { mediaType, tmdbId }: Title,
  ): Promise<TitleDocument | undefined> {
    if (mediaType === MediaType.Movie) {
      const movie = await this.metadataService.findCachedMovie(em, tmdbId);
      return movie && { mediaType, movie: movie.tmdbMovie };
    }

    const series = await this.metadataService.findCachedSeries(em, tmdbId);
    return series && { mediaType, series: series.tmdbSeries };
  }

  /** The document of the title, cached on the way; fresh when eager */
  private async fetch(
    { mediaType, tmdbId }: Title,
    eager = false,
  ): Promise<TitleDocument | undefined> {
    if (mediaType === MediaType.Movie) {
      const movie = await this.metadataService.getMovieByTmdbId(tmdbId, eager);
      return movie && { mediaType, movie: movie.tmdbMovie };
    }

    const series = await this.metadataService.getSeriesByTmdbId(tmdbId, eager);
    return series && { mediaType, series: series.tmdbSeries };
  }
}
