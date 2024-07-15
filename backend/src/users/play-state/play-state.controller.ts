import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, GetUser } from '../../auth/auth.guard';
import { User } from '../user.entity';
import { PlayStateDto, UpdatePlayStateDto } from './play-state.dtos';
import { PlayStateService } from './play-state.service';
import { ApiOkResponse } from '@nestjs/swagger';

@Controller('play-state')
@UseGuards(AuthGuard)
export class PlayStateController {
  constructor(private playStateService: PlayStateService) {}

  @Get(':tmdbId')
  @ApiOkResponse({ type: PlayStateDto, isArray: true })
  async getPlayState(
    @GetUser() user: User,
    @Param('tmdbId') tmdbId: number,
  ): Promise<PlayStateDto[]> {
    const tmdbIdNumber = Number(tmdbId);

    if (isNaN(tmdbIdNumber)) {
      throw new Error('Invalid tmdbId');
    }

    return this.playStateService.getPlayState(user, tmdbIdNumber);
  }

  @Get(':tmdbId/season/:seasonNumber/episode/:episodeNumber')
  @ApiOkResponse({ type: PlayStateDto })
  async getEpisodePlayState(
    @GetUser() user: User,
    @Param('tmdbId') tmdbId: number,
    @Param('seasonNumber') seasonNumber: number,
    @Param('episodeNumber') episodeNumber: number,
  ): Promise<PlayStateDto> {
    const tmdbIdNumber = Number(tmdbId);
    const seasonNumberNumber = Number(seasonNumber);
    const episodeNumberNumber = Number(episodeNumber);

    if (
      isNaN(tmdbIdNumber) ||
      isNaN(seasonNumberNumber) ||
      isNaN(episodeNumberNumber)
    ) {
      throw new NotFoundException();
    }

    return this.playStateService.getEpisodePlayState(
      user,
      tmdbIdNumber,
      seasonNumberNumber,
      episodeNumberNumber,
    );
  }

  @Put(':tmdbId')
  @ApiOkResponse({ type: PlayStateDto })
  async updatePlayState(
    @GetUser() user: User,
    @Param('tmdbId') tmdbId: number,
    @Body() playStateDto: UpdatePlayStateDto,
  ): Promise<PlayStateDto> {
    const tmdbIdNumber = Number(tmdbId);

    if (isNaN(tmdbIdNumber)) {
      throw new Error('Invalid tmdbId');
    }

    return this.playStateService.updateOrCreatePlayState({
      user,
      tmdbId: tmdbIdNumber,
      updatePlayStateDto: playStateDto,
    });
  }

  @Put(':tmdbId/season/:seasonNumber/episode/:episodeNumber')
  @ApiOkResponse({ type: PlayStateDto })
  async updateEpisodePlayState(
    @GetUser() user: User,
    @Param('tmdbId') tmdbId: number,
    @Param('seasonNumber') seasonNumber: number,
    @Param('episodeNumber') episodeNumber: number,
    @Body() playStateDto: UpdatePlayStateDto,
  ): Promise<PlayStateDto> {
    const tmdbIdNumber = Number(tmdbId);
    const seasonNumberNumber = Number(seasonNumber);
    const episodeNumberNumber = Number(episodeNumber);

    if (
      isNaN(tmdbIdNumber) ||
      isNaN(seasonNumberNumber) ||
      isNaN(episodeNumberNumber)
    ) {
      throw new Error('Invalid tmdbId, seasonNumber, or episodeNumber');
    }

    return this.playStateService.updateOrCreatePlayState({
      user,
      tmdbId: tmdbIdNumber,
      seasonNumber: seasonNumberNumber,
      episodeNumber: episodeNumberNumber,
      updatePlayStateDto: playStateDto,
    });
  }
}
