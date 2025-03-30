import { Inject, Injectable } from '@nestjs/common';
import { MediaTypeFull } from 'src/common/common.dto';
import { Repository } from 'typeorm';
import { UpdatePlayStateDto } from './play-state.dto';
import { PlayState } from './play-state.entity';
import { USER_PLAY_STATE_REPOSITORY } from './play-state.providers';
import { USER_LIBRARY_REPOSITORY } from '../library/library.providers';
import { LibraryItem } from '../library/library.entity';

@Injectable()
export class PlayStatesService {
  constructor(
    @Inject(USER_PLAY_STATE_REPOSITORY)
    private readonly playStateRepository: Repository<PlayState>,
    @Inject(USER_LIBRARY_REPOSITORY)
    private readonly libraryRepository: Repository<LibraryItem>,
  ) {}

  async findMoviePlayState(userId: string, tmdbId: string) {
    return this.playStateRepository.findOne({
      where: { userId, tmdbId },
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
        where: {
          userId,
          tmdbId,
          ...(season ? { season } : {}),
          ...(episode ? { episode } : {}),
        },
      })) ?? [];

    playStates.sort((a, b) => {
      if (a.season !== b.season) {
        return a.season - b.season;
      }

      return a.episode - b.episode;
    });

    return playStates;
  }

  async getPlayState(
    userId: string,
    tmdbId: string,
    season?: number,
    episode?: number,
  ): Promise<PlayState | undefined> {
    return this.playStateRepository.findOne({
      where: {
        userId,
        tmdbId,
        ...(season ? { season } : {}),
        ...(episode ? { episode } : {}),
      },
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
    let state = await this.getPlayState(
      userId,
      tmdbId,
      options.season,
      options.episode,
    );

    if (!state) {
      state = this.playStateRepository.create();
      state.userId = userId;
      state.tmdbId = tmdbId;
      if (options.season) state.season = options.season;
      if (options.episode) state.episode = options.episode;
      state.mediaType = options.mediaType;
    }

    if (options.save) {
      return this.playStateRepository.save(state);
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

    return this.playStateRepository.save(state).then(async (state) => {
      await this.libraryRepository.update(
        { tmdbId, userId },
        { lastPlayedAt: new Date() },
      );

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
    const state = await this.getOrCreatePlayState(userId, tmdbId, {
      season,
      episode,
      mediaType: MediaTypeFull.Episode,
    });

    if (playState.progress !== undefined) state.progress = playState.progress;
    if (playState.watched !== undefined) state.watched = playState.watched;

    return this.playStateRepository.save(state).then(async (state) => {
      await this.libraryRepository.update(
        { tmdbId, userId },
        { lastPlayedAt: new Date() },
      );

      return state;
    });
  }

  async deleteMoviePlayState(userId: string, tmdbId: string) {
    const state = await this.findMoviePlayState(userId, tmdbId);
    return await this.playStateRepository.remove(state);
  }

  async deleteEpisodePlayState(
    userId: string,
    tmdbId: string,
    season: number,
    episode: number,
  ) {
    const state = await this.getPlayState(userId, tmdbId, season, episode);

    if (state) {
      return await this.playStateRepository.remove(state);
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

        return this.playStateRepository.save(state);
      }),
    );

    return states;
  }
}
