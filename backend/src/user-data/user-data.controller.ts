import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GetAuthUser, UserAccessControl } from '../auth/auth.guard.js';
import { MediaType } from '../common/common.dto.js';
import { User } from '../users/user.entity.js';
import { MyListService } from './my-list/my-list.service.js';
import {
  MovieUserDataDto,
  SeriesUserDataDto,
} from './play-state/play-state.dto.js';
import { PlayStatesService } from './play-state/play-states.service.js';

@ApiTags('users')
@Controller('me/user-data')
@UseGuards(UserAccessControl)
export class UserDataController {
  constructor(
    private myListService: MyListService,
    private playStateService: PlayStatesService,
  ) {}

  @Get('movies/:tmdbId')
  @ApiOkResponse({
    description: 'User movie data found',
    type: MovieUserDataDto,
  })
  async getMovieUserData(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ): Promise<MovieUserDataDto> {
    const myListItem = await this.myListService.findByTmdbId(
      user.id,
      tmdbId,
      MediaType.Movie,
    );
    const playState = await this.playStateService.findMoviePlayState(
      user.id,
      tmdbId,
    );

    return {
      tmdbId,
      inMyList: !!myListItem,
      playState: playState,
    };
  }

  @Get('series/:tmdbId')
  @ApiOkResponse({
    description: 'User series data found',
    type: SeriesUserDataDto,
  })
  async getSeriesUserData(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ): Promise<SeriesUserDataDto> {
    const myListItem = await this.myListService.findByTmdbId(
      user.id,
      tmdbId,
      MediaType.Series,
    );
    const playState = await this.playStateService.findSeriesPlayStates(
      user.id,
      tmdbId,
    );

    return {
      tmdbId,
      inMyList: !!myListItem,
      playStates: playState,
    };
  }

  @Get('series/:tmdbId/seasons/:season/episodes/:episode')
  @ApiOkResponse({
    description: 'User series data found',
    type: MovieUserDataDto,
  })
  async getEpisodeUserData(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
  ): Promise<MovieUserDataDto> {
    const myListItem = await this.myListService.findByTmdbId(
      user.id,
      tmdbId,
      MediaType.Series,
    );
    const playState = await this.playStateService.findEpisodePlayState(
      user.id,
      tmdbId,
      season,
      episode,
    );

    return {
      tmdbId,
      inMyList: !!myListItem,
      playState: playState,
    };
  }
}
