import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/sqlite';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { MediaType, MediaTypeFull } from '../../common/common.dto.js';
import { UpdatePlayStateDto } from './play-state.dto.js';
import { PlayState } from './play-state.entity.js';
import { RequestsService } from '../../requests/requests.service.js';
import { MyListItem } from '../my-list/my-list-item.entity.js';

@Injectable()
export class PlayStatesService {
  constructor(
    @InjectRepository(PlayState)
    private readonly playStateRepository: EntityRepository<PlayState>,
    private readonly em: EntityManager,
    private readonly requestsService: RequestsService,
  ) {}

  async findMoviePlayState(userId: string, tmdbId: string) {
    return this.playStateRepository.findOne({
      userId,
      tmdbId,
      mediaType: MediaTypeFull.Movie,
    });
  }

  async findSeriesPlayStates(
    userId: string,
    tmdbId: string,
    season?: number,
    episode?: number,
  ): Promise<PlayState[]> {
    const playStates =
      (await this.playStateRepository.find({
        userId,
        tmdbId,
        mediaType: MediaTypeFull.Episode,
        ...(season ? { season } : {}),
        ...(episode ? { episode } : {}),
      })) ?? [];

    playStates.sort((a, b) => {
      if (a.season !== b.season) {
        return a.season - b.season;
      }

      return a.episode - b.episode;
    });

    return playStates;
  }

  async findEpisodePlayState(
    userId: string,
    tmdbId: string,
    season: number,
    episode: number,
  ): Promise<PlayState | undefined> {
    return this.playStateRepository.findOne({
      userId,
      tmdbId,
      mediaType: MediaTypeFull.Episode,
      season,
      episode,
    });
  }

  private async getOrCreatePlayState(
    em: EntityManager,
    userId: string,
    tmdbId: string,
    options: {
      season?: number;
      episode?: number;
      mediaType: MediaTypeFull;
    },
  ): Promise<PlayState> {
    const key = {
      userId,
      tmdbId,
      mediaType: options.mediaType,
      season: options.season ?? 0,
      episode: options.episode ?? 0,
    };

    // Two first reports for the same media, from the player and another
    // device, both create it
    await em
      .createQueryBuilder(PlayState)
      .insert({
        id: randomUUID(),
        ...key,
        watched: false,
        progress: 0,
        lastPlayedAt: new Date(),
      })
      .onConflict(['userId', 'mediaType', 'tmdbId', 'season', 'episode'])
      .ignore()
      .execute();

    return em.findOneOrFail(PlayState, key);
  }

  async updateOrCreateMoviePlayState(
    userId: string,
    tmdbId: string,
    playState: UpdatePlayStateDto,
  ) {
    return this.em.transactional(async (tx) => {
      const state = await this.getOrCreatePlayState(tx, userId, tmdbId, {
        mediaType: MediaTypeFull.Movie,
      });
      applyUpdate(state, playState);

      await tx.flush();
      await this.touchMyListItem(tx, userId, tmdbId, MediaType.Movie);

      return state;
    });
  }

  async updateOrCreateEpisodePlayState(
    userId: string,
    tmdbId: string,
    season: number,
    episode: number,
    playState: UpdatePlayStateDto,
  ) {
    return this.em.transactional(async (tx) => {
      const state = await this.getOrCreatePlayState(tx, userId, tmdbId, {
        season,
        episode,
        mediaType: MediaTypeFull.Episode,
      });
      const changed = applyUpdate(state, playState);

      await tx.flush();
      await this.touchMyListItem(tx, userId, tmdbId, MediaType.Series);
      if (changed) await this.watchStatusChanged(tx, userId, tmdbId);

      return state;
    });
  }

  async deleteMoviePlayState(userId: string, tmdbId: string) {
    const state = await this.findMoviePlayState(userId, tmdbId);
    await this.em.remove(state).flush();

    return state;
  }

  async deleteEpisodePlayState(
    userId: string,
    tmdbId: string,
    season: number,
    episode: number,
  ) {
    const state = await this.findEpisodePlayState(
      userId,
      tmdbId,
      season,
      episode,
    );

    if (state) {
      await this.em.transactional(async (tx) => {
        await tx.nativeDelete(PlayState, { id: state.id });
        if (state.watched) await this.watchStatusChanged(tx, userId, tmdbId);
      });

      return state;
    }
  }

  async updateOrCreateSeriesPlayStates(
    userId: string,
    tmdbId: string,
    playStates: UpdatePlayStateDto[],
  ) {
    return this.em.transactional(async (tx) => {
      let changed = false;
      // One at a time, because they share the entity manager
      const states: PlayState[] = [];
      for (const updatedState of playStates) {
        const state = await this.getOrCreatePlayState(tx, userId, tmdbId, {
          season: updatedState.season,
          episode: updatedState.episode,
          mediaType: MediaTypeFull.Episode,
        });
        if (applyUpdate(state, updatedState)) changed = true;
        states.push(state);
      }

      await tx.flush();
      if (changed) await this.watchStatusChanged(tx, userId, tmdbId);

      return states;
    });
  }

  private async touchMyListItem(
    em: EntityManager,
    userId: string,
    tmdbId: string,
    mediaType: MediaType,
  ) {
    const now = new Date();

    await em.nativeUpdate(
      MyListItem,
      { userId, tmdbId, mediaType },
      { lastPlayedAt: now, updatedAt: now },
    );
  }

  /** What the rule makes of the requests of the series changes with it */
  private watchStatusChanged(
    em: EntityManager,
    userId: string,
    tmdbId: string,
  ) {
    return this.requestsService.applyRule(em, {
      userId,
      mediaType: MediaType.Series,
      tmdbId,
    });
  }
}

/** Applies an update and tells whether it changed whether the media is watched */
function applyUpdate(state: PlayState, update: UpdatePlayStateDto): boolean {
  const wasWatched = state.watched;

  if (update.progress !== undefined) state.progress = update.progress;
  if (update.watched !== undefined && update.watched !== state.watched) {
    state.watched = update.watched;
    state.watchedAt = update.watched ? new Date() : null;
  }

  return state.watched !== wasWatched;
}
