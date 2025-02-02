import {
  Body,
  Controller,
  Delete,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlayStateService } from './play-state.service';
import { UserAccessControl } from 'src/auth/auth.guard';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { UpdatePlayStateDto } from './play-state.dto';
import { MediaType } from 'src/common/common.dto';

@ApiTags('users')
@Controller('users/:userId/play-state')
@UseGuards(UserAccessControl)
export class PlayStateController {
  constructor(private playStateService: PlayStateService) {}

  @Put('movie/tmdb/:tmdbId')
  // @ApiQuery({ name: 'mediaType', enum: MediaType, required: false })
  async updateMoviePlayStateByTmdbId(
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

  @Delete('movie/tmdb/:tmdbId')
  async deleteMoviePlayStateByTmdbId(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
  ) {
    return this.playStateService.deleteMoviePlayState(userId, tmdbId);
  }

  @Put('show/tmdb/:tmdbId/season/:season/episode/:episode')
  async updateEpisodePlayStateByTmdbId(
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

  @Delete('show/tmdb/:tmdbId/season/:season/episode/:episode')
  async deleteEpisodePlayStateByTmdbId(
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
}
