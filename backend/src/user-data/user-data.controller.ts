import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserAccessControl } from '../auth/auth.guard.js';
import { MediaType } from '../common/common.dto.js';
import { LibraryService } from './library/library.service.js';
import {
  MovieUserDataDto,
  SeriesUserDataDto,
} from './play-state/play-state.dto.js';
import { PlayStatesService } from './play-state/play-states.service.js';

@ApiTags('users')
@Controller('users')
export class UserDataController {
  constructor(
    private libraryService: LibraryService,
    private playStateService: PlayStatesService,
  ) {}

  @UseGuards(UserAccessControl)
  @Get(':userId/user-data/movies/:tmdbId')
  @ApiOkResponse({
    description: 'User movie data found',
    type: MovieUserDataDto,
  })
  async getMovieUserData(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
  ): Promise<MovieUserDataDto> {
    const libraryItem = await this.libraryService.findByTmdbId(
      userId,
      tmdbId,
      MediaType.Movie,
    );
    const playState = await this.playStateService.findMoviePlayState(
      userId,
      tmdbId,
    );

    return {
      tmdbId,
      inMyList: !!libraryItem,
      playState: playState,
    };
  }

  @UseGuards(UserAccessControl)
  @Get(':userId/user-data/series/:tmdbId')
  @ApiOkResponse({
    description: 'User series data found',
    type: SeriesUserDataDto,
  })
  async getSeriesUserData(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
  ): Promise<SeriesUserDataDto> {
    const libraryItem = await this.libraryService.findByTmdbId(
      userId,
      tmdbId,
      MediaType.Series,
    );
    const playState = await this.playStateService.findSeriesPlayStates(
      userId,
      tmdbId,
    );

    return {
      tmdbId,
      inMyList: !!libraryItem,
      playStates: playState,
    };
  }

  @UseGuards(UserAccessControl)
  @Get(':userId/user-data/series/:tmdbId/seasons/:season/episodes/:episode')
  @ApiOkResponse({
    description: 'User series data found',
    type: MovieUserDataDto,
  })
  async getEpisodeUserData(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
  ): Promise<MovieUserDataDto> {
    const libraryItem = await this.libraryService.findByTmdbId(
      userId,
      tmdbId,
      MediaType.Series,
    );
    const playState = await this.playStateService.findEpisodePlayState(
      userId,
      tmdbId,
      season,
      episode,
    );

    return {
      tmdbId,
      inMyList: !!libraryItem,
      playState: playState,
    };
  }
}
