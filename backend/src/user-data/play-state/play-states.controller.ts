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
import { UserAccessControl } from '../../auth/auth.guard.js';
import {
  BulkUpdatePlayStateDto,
  UpdatePlayStateDto,
} from './play-state.dto.js';
import { PlayStatesService } from './play-states.service.js';

@ApiTags('users')
@Controller('users/:userId/play-states')
@UseGuards(UserAccessControl)
export class PlayStatesController {
  constructor(private playStateService: PlayStatesService) {}

  @Put('movies/:tmdbId')
  // @ApiQuery({ name: 'mediaType', enum: MediaType, required: false })
  async updateMoviePlayState(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
    @Body() playState: UpdatePlayStateDto,
    // @Query('mediaType', new ParseEnumPipe(MediaType, { optional: true }))
    // mediaType?: MediaType,
  ) {
    return this.playStateService.updateOrCreateMoviePlayState(
      userId,
      tmdbId,
      playState,
    );
  }

  @Delete('movies/:tmdbId')
  async deleteMoviePlayState(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
  ) {
    return this.playStateService.deleteMoviePlayState(userId, tmdbId);
  }

  @Put('series/:tmdbId/seasons/:season/episodes/:episode')
  async updateEpisodePlayState(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
    @Body() playState: UpdatePlayStateDto,
  ) {
    return this.playStateService.updateOrCreateEpisodePlayState(
      userId,
      tmdbId,
      season,
      episode,
      playState,
    );
  }

  @Delete('series/:tmdbId/seasons/:season/episodes/:episode')
  async deleteEpisodePlayState(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
  ) {
    return this.playStateService.deleteEpisodePlayState(
      userId,
      tmdbId,
      season,
      episode,
    );
  }

  @Put('series/:tmdbId')
  async updateSeriesPlayStates(
    @Param('userId') userId: string,
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
      userId,
      tmdbId,
      body.playStates,
    );
  }
}
