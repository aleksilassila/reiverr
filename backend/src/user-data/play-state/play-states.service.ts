import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/sqlite';
import { Injectable } from '@nestjs/common';
import { MediaType, MediaTypeFull } from '../../common/common.dto.js';
import { UpdatePlayStateDto } from './play-state.dto.js';
import { PlayState } from './play-state.entity.js';
import { LibraryItem } from '../library/library.entity.js';

@Injectable()
export class PlayStatesService {
  constructor(
    @InjectRepository(PlayState)
    private readonly playStateRepository: EntityRepository<PlayState>,
    @InjectRepository(LibraryItem)
    private readonly libraryRepository: EntityRepository<LibraryItem>,
    private readonly em: EntityManager,
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

    if (playState.progress !== undefined) state.progress = playState.progress;
    if (playState.watched !== undefined) state.watched = playState.watched;

    await this.em.persist(state).flush();
    await this.touchLibraryItem(userId, tmdbId, MediaType.Movie);

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

    if (playState.progress !== undefined) state.progress = playState.progress;
    if (playState.watched !== undefined) state.watched = playState.watched;

    await this.em.persist(state).flush();
    await this.touchLibraryItem(userId, tmdbId, MediaType.Series);

    return state;
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
      await this.em.remove(state).flush();

      return state;
    }
  }

  async updateOrCreateSeriesPlayStates(
    userId: string,
    tmdbId: string,
    playStates: UpdatePlayStateDto[],
  ) {
    const states = await Promise.all(
      playStates.map(async (updatedState) => {
        const state = await this.getOrCreatePlayState(userId, tmdbId, {
          season: updatedState.season,
          episode: updatedState.episode,
          mediaType: MediaTypeFull.Episode,
        });

        if (updatedState.progress !== undefined)
          state.progress = updatedState.progress;
        if (updatedState.watched !== undefined)
          state.watched = updatedState.watched;

        return state;
      }),
    );

    await this.em.persist(states).flush();

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
}
