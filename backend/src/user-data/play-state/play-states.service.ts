import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/sqlite';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MediaType, MediaTypeFull } from '../../common/common.dto.js';
import { UpdatePlayStateDto } from './play-state.dto.js';
import { PlayState } from './play-state.entity.js';
import {
  WATCH_STATUS_CHANGED,
  WatchStatusChangedEvent,
} from './play-state.events.js';
import { LibraryItem } from '../library/library.entity.js';

@Injectable()
export class PlayStatesService {
  constructor(
    @InjectRepository(PlayState)
    private readonly playStateRepository: EntityRepository<PlayState>,
    @InjectRepository(LibraryItem)
    private readonly libraryRepository: EntityRepository<LibraryItem>,
    private readonly em: EntityManager,
    private readonly eventEmitter: EventEmitter2,
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

  /** The episode play states of each user for the series given with them */
  async findEpisodePlayStates(
    series: { userId: string; tmdbId: string }[],
  ): Promise<PlayState[]> {
    const keyOf = (s: { userId: string; tmdbId: string }) =>
      `${s.userId}/${s.tmdbId}`;
    const keys = new Set(series.map(keyOf));

    const playStates = await this.playStateRepository.find(
      {
        mediaType: MediaTypeFull.Episode,
        userId: { $in: [...new Set(series.map((s) => s.userId))] },
        tmdbId: { $in: [...new Set(series.map((s) => s.tmdbId))] },
      },
      { disableIdentityMap: true },
    );

    return playStates.filter((playState) => keys.has(keyOf(playState)));
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
    userId: string,
    tmdbId: string,
    options: {
      season?: number;
      episode?: number;
      mediaType: MediaTypeFull;
      save?: boolean;
    },
  ) {
    let state =
      options.mediaType === MediaTypeFull.Movie
        ? await this.findMoviePlayState(userId, tmdbId)
        : await this.findEpisodePlayState(
            userId,
            tmdbId,
            options.season,
            options.episode,
          );

    if (!state) {
      state = new PlayState();
      state.userId = userId;
      state.tmdbId = tmdbId;
      if (options.season) state.season = options.season;
      if (options.episode) state.episode = options.episode;
      state.mediaType = options.mediaType;
    }

    if (options.save) {
      await this.em.persist(state).flush();
    }

    return state;
  }

  async updateOrCreateMoviePlayState(
    userId: string,
    tmdbId: string,
    playState: UpdatePlayStateDto,
  ) {
    const state = await this.getOrCreatePlayState(userId, tmdbId, {
      mediaType: MediaTypeFull.Movie,
    });
    const changed = applyUpdate(state, playState);

    await this.em.persist(state).flush();
    await this.touchLibraryItem(userId, tmdbId, MediaType.Movie);
    if (changed) this.emitChanged(userId, tmdbId, MediaTypeFull.Movie);

    return state;
  }

  async updateOrCreateEpisodePlayState(
    userId: string,
    tmdbId: string,
    season: number,
    episode: number,
    playState: UpdatePlayStateDto,
  ) {
    const state = await this.getOrCreatePlayState(userId, tmdbId, {
      season,
      episode,
      mediaType: MediaTypeFull.Episode,
    });
    const changed = applyUpdate(state, playState);

    await this.em.persist(state).flush();
    await this.touchLibraryItem(userId, tmdbId, MediaType.Series);
    if (changed) this.emitChanged(userId, tmdbId, MediaTypeFull.Episode);

    return state;
  }

  async deleteMoviePlayState(userId: string, tmdbId: string) {
    const state = await this.findMoviePlayState(userId, tmdbId);
    await this.em.remove(state).flush();
    this.emitChanged(userId, tmdbId, MediaTypeFull.Movie);

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
      await this.em.remove(state).flush();
      this.emitChanged(userId, tmdbId, MediaTypeFull.Episode);

      return state;
    }
  }

  async updateOrCreateSeriesPlayStates(
    userId: string,
    tmdbId: string,
    playStates: UpdatePlayStateDto[],
  ) {
    let changed = false;
    const states = await Promise.all(
      playStates.map(async (updatedState) => {
        const state = await this.getOrCreatePlayState(userId, tmdbId, {
          season: updatedState.season,
          episode: updatedState.episode,
          mediaType: MediaTypeFull.Episode,
        });
        if (applyUpdate(state, updatedState)) changed = true;

        return state;
      }),
    );

    await this.em.persist(states).flush();
    if (changed) this.emitChanged(userId, tmdbId, MediaTypeFull.Episode);

    return states;
  }

  private async touchLibraryItem(
    userId: string,
    tmdbId: string,
    mediaType: MediaType,
  ) {
    const now = new Date();

    await this.libraryRepository.nativeUpdate(
      { userId, tmdbId, mediaType },
      { lastPlayedAt: now, updatedAt: now },
    );
  }

  private emitChanged(
    userId: string,
    tmdbId: string,
    mediaType: MediaTypeFull,
  ) {
    const event: WatchStatusChangedEvent = { userId, tmdbId, mediaType };
    this.eventEmitter.emit(WATCH_STATUS_CHANGED, event);
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
