import {
  Body,
  Controller,
  Delete,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PlayStateService } from './play-state.service';
import { UserAccessControl } from 'src/auth/auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { UpdatePlayStateDto } from './play-state.dto';

@ApiTags('users')
@Controller('users/:userId/play-state')
@UseGuards(UserAccessControl)
export class PlayStateController {
  constructor(private playStateService: PlayStateService) {}

  @Put('movie/tmdb/:tmdbId')
  async updateMoviePlayStateByTmdbId(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
    @Body() playState: UpdatePlayStateDto,
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
}
