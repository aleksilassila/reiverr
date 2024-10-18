import { Inject, Injectable } from '@nestjs/common';
import { User } from '../user.entity';
import { MEDIA_REPOSITORY, TITLE_REPOSITORY } from './title.providers';
import { Repository } from 'typeorm';
import { Title, TitleType } from './title.entity';
import { UpdateProgressDto, UpdateTitleDto } from './title.dtos';
import { Media } from './media.entity';

@Injectable()
export class TitleService {
  constructor(
    @Inject(TITLE_REPOSITORY)
    private readonly titleRepository: Repository<Title>,
    @Inject(MEDIA_REPOSITORY)
    private readonly mediaRepository: Repository<Media>,
  ) {}

  // getPlayState(user: User, tmdbId: number) {
  //   return this.playStateRepository.find({
  //     where: { user: { id: user.id }, tmdbId },
  //   });
  // }
  //
  // getEpisodePlayState(
  //   user: User,
  //   tmdbId: number,
  //   seasonNumber: number,
  //   episodeNumber: number,
  // ) {
  //   return this.playStateRepository.findOne({
  //     where: { user: { id: user.id }, tmdbId, seasonNumber, episodeNumber },
  //   });
  // }
  //
  // async updateOrCreatePlayState({
  //   user,
  //   tmdbId,
  //   seasonNumber,
  //   episodeNumber,
  //   updatePlayStateDto,
  // }: {
  //   user: User;
  //   tmdbId: number;
  //   seasonNumber?: number;
  //   episodeNumber?: number;
  //   updatePlayStateDto: UpdateTitleDto;
  // }) {
  //   let playState = await this.playStateRepository.findOne({
  //     where: { user: { id: user.id }, tmdbId, seasonNumber, episodeNumber },
  //   });
  //
  //   console.log('playState:', playState);
  //
  //   if (playState) {
  //     playState.showInUpNext =
  //       updatePlayStateDto.showInUpNext ?? playState.showInUpNext;
  //     playState.progress = updatePlayStateDto.progress ?? playState.progress;
  //     playState.watched = updatePlayStateDto.watched ?? playState.watched;
  //   } else {
  //     playState = this.playStateRepository.create({
  //       tmdbId,
  //       seasonNumber,
  //       episodeNumber,
  //       progress: updatePlayStateDto.progress,
  //       watched: updatePlayStateDto.watched,
  //       showInUpNext: updatePlayStateDto.showInUpNext,
  //       user,
  //     });
  //   }
  //
  //   return this.playStateRepository.save(playState);
  // }
  getLibrary(user: User) {
    return this.titleRepository.find({
      where: { user: { id: user.id }, isInLibrary: true },
      relations: ['media'],
    });
  }

  getContinueWatching(user: User) {
    return this.titleRepository.find({
      where: { user: { id: user.id }, upNext: true },
      relations: ['media'],
    });
  }

  getTitle(
    user: User,
    tmdbId: number,
    type: TitleType,
  ): Promise<Title | undefined> {
    return this.titleRepository.findOne({
      where: { user: { id: user.id }, tmdbId, type },
      relations: ['media'],
    });
  }

  async updateTitle(
    user: User,
    tmdbId: number,
    type: TitleType,
    updateTitleDto: UpdateTitleDto,
  ) {
    const title = await this.getOrCreateTitle(user, tmdbId, type);

    title.upNext = updateTitleDto.upNext ?? title.upNext;
    title.isInLibrary = updateTitleDto.isInLibrary ?? title.isInLibrary;

    await this.titleRepository.save(title);

    return this.getTitle(user, tmdbId, type);
  }

  private async getOrCreateTitle(user: User, tmdbId: number, type: TitleType) {
    let title = await this.getTitle(user, tmdbId, type);

    if (title) {
      return title;
    }

    title = this.titleRepository.create({
      tmdbId,
      user,
      type,
    });

    await this.titleRepository.save(title);

    return this.getTitle(user, tmdbId, type);
  }

  async updateProgress(
    user: User,
    tmdbId: number,
    type: TitleType,
    season: number | undefined,
    episode: number | undefined,
    updateTitleDto: UpdateProgressDto,
  ) {
    const media = await this.getOrCreateMedia(
      user,
      tmdbId,
      type,
      season,
      episode,
    );

    media.progress = updateTitleDto.progress ?? media.progress;
    media.watched = updateTitleDto.watched ?? media.watched;

    await this.mediaRepository.save(media);

    return this.getTitle(user, tmdbId, type);
  }

  private async getOrCreateMedia(
    user: User,
    tmdbId: number,
    type: TitleType,
    season?: number,
    episode?: number,
  ) {
    const title = await this.getOrCreateTitle(user, tmdbId, type);

    let media = await this.mediaRepository.findOne({
      where: {
        title: { id: title.id },
        seasonNumber: season,
        episodeNumber: episode,
      },
    });

    if (media) {
      return media;
    }

    media = this.mediaRepository.create({
      title,
      seasonNumber: season,
      episodeNumber: episode,
    });

    return this.mediaRepository.save(media);
  }
}
