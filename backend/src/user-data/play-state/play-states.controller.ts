import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetAuthUser, UserAccessControl } from '../../auth/auth.guard.js';
import { User } from '../../users/user.entity.js';
import {
  BulkUpdatePlayStateDto,
  UpdatePlayStateDto,
} from './play-state.dto.js';
import { PlayStatesService } from './play-states.service.js';

@ApiTags('users')
@Controller('me/play-states')
@UseGuards(UserAccessControl)
export class PlayStatesController {
  constructor(private playStateService: PlayStatesService) {}

  @Put('movies/:tmdbId')
  async updateMoviePlayState(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
    @Body() playState: UpdatePlayStateDto,
  ) {
    return this.playStateService.updateOrCreateMoviePlayState(
      user.id,
      tmdbId,
      playState,
    );
  }

  @Delete('movies/:tmdbId')
  async deleteMoviePlayState(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ) {
    return this.playStateService.deleteMoviePlayState(user.id, tmdbId);
  }

  @Put('series/:tmdbId/seasons/:season/episodes/:episode')
  async updateEpisodePlayState(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
    @Body() playState: UpdatePlayStateDto,
  ) {
    return this.playStateService.updateOrCreateEpisodePlayState(
      user.id,
      tmdbId,
      season,
      episode,
      playState,
    );
  }

  @Delete('series/:tmdbId/seasons/:season/episodes/:episode')
  async deleteEpisodePlayState(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
  ) {
    return this.playStateService.deleteEpisodePlayState(
      user.id,
      tmdbId,
      season,
      episode,
    );
  }

  @Put('series/:tmdbId')
  async updateSeriesPlayStates(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
    @Body() body: BulkUpdatePlayStateDto,
  ) {
    const isValid =
      Array.isArray(body?.playStates) &&
      body.playStates.every(
        (s) => Number.isInteger(s?.season) && Number.isInteger(s?.episode),
      );
    if (!isValid) {
      throw new BadRequestException(
        'Expected { playStates: [{ season, episode, watched?, progress? }] }',
      );
    }

    return this.playStateService.updateOrCreateSeriesPlayStates(
      user.id,
      tmdbId,
      body.playStates,
    );
  }
}
