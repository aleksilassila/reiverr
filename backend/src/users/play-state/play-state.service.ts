import { Inject, Injectable } from '@nestjs/common';
import { UpdatePlayStateDto } from './play-state.dto';
import { USER_PLAY_STATE_REPOSITORY } from '../user.providers';
import { PlayState } from './play-state.entity';
import { Repository } from 'typeorm';
import { MediaType } from 'src/common/common.dto';

@Injectable()
export class PlayStateService {
  constructor(
    @Inject(USER_PLAY_STATE_REPOSITORY)
    private readonly playStateRepository: Repository<PlayState>,
  ) {}

  async findMoviePlayState(userId: string, tmdbId: string) {
    return this.playStateRepository.findOne({
      where: { userId, tmdbId },
    });
  }

  async findShowPlayState(
    userId: string,
    tmdbId: string,
    season?: number,
    episode?: number,
  ): Promise<PlayState | undefined> {
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

    return playStates[0];
  }

  async updateOrCreateMoviePlayState(
    userId: string,
    tmdbId: string,
    playState: UpdatePlayStateDto,
    mediaType?: MediaType,
  ) {
    let state = await this.findMoviePlayState(userId, tmdbId);

    if (!state) {
      state = this.playStateRepository.create();
      state.userId = userId;
      state.tmdbId = tmdbId;
      if (mediaType) {
        state.mediaType = mediaType;
      }
    }

    state.progress = playState.progress;
    state.watched = playState.watched;

    return this.playStateRepository.save(state);
  }

  async updateOrCreateEpisodePlayState(
    userId: string,
    tmdbId: string,
    season: number,
    episode: number,
    playState: UpdatePlayStateDto,
  ) {
    let state = await this.findShowPlayState(userId, tmdbId, season, episode);

    if (!state) {
      state = this.playStateRepository.create();
      state.userId = userId;
      state.tmdbId = tmdbId;
      state.season = season;
      state.episode = episode;
    }

    state.progress = playState.progress;
    state.watched = playState.watched;

    return this.playStateRepository.save(state);
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
    const state = await this.findShowPlayState(userId, tmdbId, season, episode);
    return await this.playStateRepository.remove(state);
  }
}
