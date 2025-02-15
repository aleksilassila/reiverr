import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserAccessControl } from 'src/auth/auth.guard';
import { BulkUpdatePlayStateDto, UpdatePlayStateDto } from './play-state.dto';
import { PlayStatesService } from './play-states.service';

@ApiTags('users')
@Controller('users/:userId/play-state')
@UseGuards(UserAccessControl)
export class PlayStatesController {
  constructor(private playStateService: PlayStatesService) {}

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

  @Put('series/tmdb/:tmdbId/season/:season/episode/:episode')
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

  @Delete('series/tmdb/:tmdbId/season/:season/episode/:episode')
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

  @Put('series/tmdb/:tmdbId')
  async updateSeriesPlayStatesByTmdbId(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
    @Body() body: BulkUpdatePlayStateDto,
  ) {
    return this.playStateService.updateOrCreateSeriesPlayStates(
      userId,
      tmdbId,
      body.playStates,
    );
  }
}
