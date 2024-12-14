import { Inject, Injectable } from '@nestjs/common';
import { UpdatePlayStateDto } from './play-state.dto';
import { USER_PLAY_STATE_REPOSITORY } from '../user.providers';
import { PlayState } from './play-state.entity';
import { Repository } from 'typeorm';

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

  async updateOrCreateMoviePlayState(
    userId: string,
    tmdbId: string,
    playState: UpdatePlayStateDto,
  ) {
    let state = await this.findMoviePlayState(userId, tmdbId);

    if (!state) {
      state = this.playStateRepository.create();
      state.userId = userId;
      state.tmdbId = tmdbId;
    }

    state.progress = playState.progress;
    state.watched = playState.watched;

    return this.playStateRepository.save(state);
  }

  async deleteMoviePlayState(userId: string, tmdbId: string) {
    const state = await this.findMoviePlayState(userId, tmdbId);
    return await this.playStateRepository.remove(state);
  }
}
