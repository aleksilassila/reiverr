import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserAccessControl } from 'src/auth/auth.guard';
import { LibraryService } from './library/library.service';
import {
  MovieUserDataDto,
  SeriesUserDataDto,
} from './play-state/play-state.dto';
import { PlayStatesService } from './play-state/play-states.service';

@ApiTags('users')
@Controller('users')
export class UserDataController {
  constructor(
    private libraryService: LibraryService,
    private playStateService: PlayStatesService,
  ) {}

  @UseGuards(UserAccessControl)
  @Get(':userId/user-data/movie/tmdb/:tmdbId')
  @ApiOkResponse({
    description: 'User movie data found',
    type: MovieUserDataDto,
  })
  async getMovieUserData(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
  ): Promise<MovieUserDataDto> {
    const libraryItem = await this.libraryService.findByTmdbId(userId, tmdbId);
    const playState = await this.playStateService.findMoviePlayState(
      userId,
      tmdbId,
    );

    return {
      tmdbId,
      inLibrary: !!libraryItem,
      playState: playState,
    };
  }

  @UseGuards(UserAccessControl)
  @Get(':userId/user-data/series/tmdb/:tmdbId')
  @ApiOkResponse({
    description: 'User series data found',
    type: SeriesUserDataDto,
  })
  async getSeriesUserData(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
  ): Promise<SeriesUserDataDto> {
    const libraryItem = await this.libraryService.findByTmdbId(userId, tmdbId);
    const playState = await this.playStateService.findSeriesPlayStates(
      userId,
      tmdbId,
    );

    return {
      tmdbId,
      inLibrary: !!libraryItem,
      playStates: playState,
    };
  }

  @UseGuards(UserAccessControl)
  @Get(':userId/user-data/series/tmdb/:tmdbId/season/:season/episode/:episode')
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
    const libraryItem = await this.libraryService.findByTmdbId(userId, tmdbId);
    const playState = await this.playStateService.getPlayState(
      userId,
      tmdbId,
      season,
      episode,
    );

    return {
      tmdbId,
      inLibrary: !!libraryItem,
      playState: playState,
    };
  }
}
