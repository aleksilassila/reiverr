import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GetAuthUser, UserAccessControl } from '../auth/auth.guard.js';
import { MediaType, SuccessResponseDto } from '../common/common.dto.js';
import { User } from '../users/user.entity.js';
import { PlayStatesService } from './play-states.service.js';
import { TitleStateService } from './title-state.service.js';
import {
  BulkUpdatePlayStateDto,
  MovieUserDataDto,
  SeriesUserDataDto,
  UpdatePlayStateDto,
} from './user-data.dto.js';

/**
 * What the user of the session has with a title: the document of a movie
 * or a series, and its parts to write, the play states and the place on
 * the list
 */
@ApiTags('userData')
@Controller('me/user-data')
@UseGuards(UserAccessControl)
export class UserDataController {
  constructor(
    private titleStateService: TitleStateService,
    private playStatesService: PlayStatesService,
  ) {}

  // Movies

  @Get('movies/:tmdbId')
  @ApiOkResponse({ type: MovieUserDataDto })
  async getMovieUserData(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ): Promise<MovieUserDataDto> {
    const state = await this.titleStateService.findByTmdbId(
      user.id,
      tmdbId,
      MediaType.Movie,
    );
    const playState = await this.playStatesService.findMoviePlayState(
      user.id,
      tmdbId,
    );

    return {
      tmdbId,
      inMyList: !!state?.addedToMyListAt,
      playState: playState,
    };
  }

  @Put('movies/:tmdbId/play-state')
  async updateMoviePlayState(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
    @Body() playState: UpdatePlayStateDto,
  ) {
    return this.playStatesService.updateOrCreateMoviePlayState(
      user.id,
      tmdbId,
      playState,
    );
  }

  @Delete('movies/:tmdbId/play-state')
  async deleteMoviePlayState(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ) {
    return this.playStatesService.deleteMoviePlayState(user.id, tmdbId);
  }

  @Put('movies/:tmdbId/my-list')
  @ApiOkResponse({ type: SuccessResponseDto })
  async addMovieToMyList(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ): Promise<SuccessResponseDto> {
    await this.titleStateService.addToMyList(user.id, tmdbId, MediaType.Movie);

    return { success: true };
  }

  @Delete('movies/:tmdbId/my-list')
  @ApiOkResponse({
    description: 'Whether the movie was on the list',
    type: SuccessResponseDto,
  })
  async removeMovieFromMyList(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ): Promise<SuccessResponseDto> {
    const removed = await this.titleStateService.removeFromMyList(
      user.id,
      tmdbId,
      MediaType.Movie,
    );

    return { success: removed };
  }

  // Series

  @Get('series/:tmdbId')
  @ApiOkResponse({ type: SeriesUserDataDto })
  async getSeriesUserData(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ): Promise<SeriesUserDataDto> {
    const state = await this.titleStateService.findByTmdbId(
      user.id,
      tmdbId,
      MediaType.Series,
    );
    const playStates = await this.playStatesService.findSeriesPlayStates(
      user.id,
      tmdbId,
    );

    return {
      tmdbId,
      inMyList: !!state?.addedToMyListAt,
      playStates,
    };
  }

  @Put('series/:tmdbId/play-states')
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

    return this.playStatesService.updateOrCreateSeriesPlayStates(
      user.id,
      tmdbId,
      body.playStates,
    );
  }

  @Put('series/:tmdbId/play-states/seasons/:season/episodes/:episode')
  async updateEpisodePlayState(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
    @Body() playState: UpdatePlayStateDto,
  ) {
    return this.playStatesService.updateOrCreateEpisodePlayState(
      user.id,
      tmdbId,
      season,
      episode,
      playState,
    );
  }

  @Delete('series/:tmdbId/play-states/seasons/:season/episodes/:episode')
  async deleteEpisodePlayState(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
  ) {
    return this.playStatesService.deleteEpisodePlayState(
      user.id,
      tmdbId,
      season,
      episode,
    );
  }

  @Put('series/:tmdbId/my-list')
  @ApiOkResponse({ type: SuccessResponseDto })
  async addSeriesToMyList(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ): Promise<SuccessResponseDto> {
    await this.titleStateService.addToMyList(user.id, tmdbId, MediaType.Series);

    return { success: true };
  }

  @Delete('series/:tmdbId/my-list')
  @ApiOkResponse({
    description: 'Whether the series was on the list',
    type: SuccessResponseDto,
  })
  async removeSeriesFromMyList(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ): Promise<SuccessResponseDto> {
    const removed = await this.titleStateService.removeFromMyList(
      user.id,
      tmdbId,
      MediaType.Series,
    );

    return { success: removed };
  }
}
