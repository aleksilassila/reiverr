import { Inject, Injectable } from '@nestjs/common';
import { User } from '../user.entity';
import { PLAY_STATE_REPOSITORY } from './play-state.providers';
import { Repository } from 'typeorm';
import { PlayState } from './play-state.entity';
import { UpdatePlayStateDto } from './play-state.dtos';

@Injectable()
export class PlayStateService {
  constructor(
    @Inject(PLAY_STATE_REPOSITORY)
    private readonly playStateRepository: Repository<PlayState>,
  ) {}

  getPlayState(user: User, tmdbId: number) {
    return this.playStateRepository.find({
      where: { user: { id: user.id }, tmdbId },
    });
  }

  getEpisodePlayState(
    user: User,
    tmdbId: number,
    seasonNumber: number,
    episodeNumber: number,
  ) {
    return this.playStateRepository.findOne({
      where: { user: { id: user.id }, tmdbId, seasonNumber, episodeNumber },
    });
  }

  async updateOrCreatePlayState({
    user,
    tmdbId,
    seasonNumber,
    episodeNumber,
    updatePlayStateDto,
  }: {
    user: User;
    tmdbId: number;
    seasonNumber?: number;
    episodeNumber?: number;
    updatePlayStateDto: UpdatePlayStateDto;
  }) {
    let playState = await this.playStateRepository.findOne({
      where: { user: { id: user.id }, tmdbId, seasonNumber, episodeNumber },
    });

    console.log('playState:', playState);

    if (playState) {
      playState.showInUpNext =
        updatePlayStateDto.showInUpNext ?? playState.showInUpNext;
      playState.progress = updatePlayStateDto.progress ?? playState.progress;
      playState.watched = updatePlayStateDto.watched ?? playState.watched;
    } else {
      playState = this.playStateRepository.create({
        tmdbId,
        seasonNumber,
        episodeNumber,
        progress: updatePlayStateDto.progress,
        watched: updatePlayStateDto.watched,
        showInUpNext: updatePlayStateDto.showInUpNext,
        user,
      });
    }

    return this.playStateRepository.save(playState);
  }
}
