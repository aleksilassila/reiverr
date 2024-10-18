import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, GetUser } from '../../auth/auth.guard';
import { User } from '../user.entity';
import {
  ContinueWatchingDto,
  TitleDto,
  UpdateProgressDto,
  UpdateTitleDto,
} from './title.dtos';
import { TitleService } from './title.service';
import { ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { TitleType } from './title.entity';

@Controller('titles')
@UseGuards(AuthGuard)
export class TitlesController {
  constructor(private titleService: TitleService) {}

  /*
    GET /library
    GET /continue-watching
    GET /:tmdbId

    PUT /:tmdbId 1. Add to library -> Title created

    2. Update progress -> Media created
    3. Set title.upNext = true (and title.watched if necessary)
    4. Set media.watched = calculate
    5. If watched = true, set progress to 0 for next episode (create)
    PUT /progress/:tmdbId
    PUT /progress/:tmdbId/season/:season/episode/:episode
   */

  @Get('library')
  @ApiOkResponse({ type: TitleDto, isArray: true })
  async getLibrary(@GetUser() user: User): Promise<TitleDto[]> {
    return this.titleService
      .getLibrary(user)
      .then((r) => r.map(TitleDto.fromEntity));
  }

  @Get('continue-watching')
  @ApiOkResponse({ type: ContinueWatchingDto, isArray: true })
  async getContinueWatching(
    @GetUser() user: User,
  ): Promise<ContinueWatchingDto[]> {
    const titles = await this.titleService.getContinueWatching(user);

    return titles.map((title) => {
      title.media.sort((a, b) => {
        if (a.seasonNumber === b.seasonNumber) {
          return a.episodeNumber - b.episodeNumber;
        }

        return a.seasonNumber - b.seasonNumber;
      });

      const nextEpisode = title.media.find((media) => !media.watched);

      return {
        title: TitleDto.fromEntity(title),
        nextEpisode,
      };
    });
  }

  @Get(':tmdbId')
  @ApiOkResponse({ type: TitleDto })
  @ApiQuery({ name: 'type', enum: TitleType })
  async getTitle(
    @GetUser() user: User,
    @Query('type') type: TitleType,
    @Param('tmdbId') tmdbId: number,
  ): Promise<TitleDto> {
    const tmdbIdNumber = Number(tmdbId);

    if (isNaN(tmdbIdNumber)) {
      throw new NotFoundException();
    }

    return this.titleService.getTitle(user, tmdbIdNumber, type);
  }

  @Put(':tmdbId')
  @ApiOkResponse({ type: TitleDto })
  @ApiQuery({ name: 'type', enum: TitleType })
  async updateTitle(
    @GetUser() user: User,
    @Param('tmdbId') tmdbId: number,
    @Query('type') type: TitleType,
    @Body() updateTitleDto: UpdateTitleDto,
  ): Promise<TitleDto> {
    const tmdbIdNumber = Number(tmdbId);

    if (isNaN(tmdbIdNumber)) {
      throw new NotFoundException();
    }

    return this.titleService.updateTitle(
      user,
      tmdbIdNumber,
      type,
      updateTitleDto,
    );
  }

  @Put('progress/:tmdbId')
  @Put('progress/:tmdbId/season/:season/episode/:episode')
  @ApiOkResponse({ type: TitleDto })
  @ApiQuery({ name: 'type', enum: TitleType })
  async updateProgress(
    @GetUser() user: User,
    @Param('tmdbId') tmdbId: number,
    @Param('season') season: number | undefined,
    @Param('episode') episode: number | undefined,
    @Query('type') type: TitleType,
    @Body() updateTitleDto: UpdateProgressDto,
  ): Promise<TitleDto> {
    const tmdbIdNumber = Number(tmdbId);
    const seasonNumber = Number(season) || undefined;
    const episodeNumber = Number(episode) || undefined;

    if (isNaN(tmdbIdNumber)) {
      throw new NotFoundException();
    }

    return this.titleService.updateProgress(
      user,
      tmdbIdNumber,
      type,
      seasonNumber,
      episodeNumber,
      updateTitleDto,
    );
  }

  // @Get(':tmdbId')
  // @ApiOkResponse({ type: TitleDto, isArray: true })
  // async getPlayState(
  //   @GetUser() user: User,
  //   @Param('tmdbId') tmdbId: number,
  // ): Promise<TitleDto[]> {
  //   const tmdbIdNumber = Number(tmdbId);
  //
  //   if (isNaN(tmdbIdNumber)) {
  //     throw new Error('Invalid tmdbId');
  //   }
  //
  //   return this.playStateService.getPlayState(user, tmdbIdNumber);
  // }
  //
  // @Get(':tmdbId/season/:seasonNumber/episode/:episodeNumber')
  // @ApiOkResponse({ type: TitleDto })
  // async getEpisodePlayState(
  //   @GetUser() user: User,
  //   @Param('tmdbId') tmdbId: number,
  //   @Param('seasonNumber') seasonNumber: number,
  //   @Param('episodeNumber') episodeNumber: number,
  // ): Promise<TitleDto> {
  //   const tmdbIdNumber = Number(tmdbId);
  //   const seasonNumberNumber = Number(seasonNumber);
  //   const episodeNumberNumber = Number(episodeNumber);
  //
  //   if (
  //     isNaN(tmdbIdNumber) ||
  //     isNaN(seasonNumberNumber) ||
  //     isNaN(episodeNumberNumber)
  //   ) {
  //     throw new NotFoundException();
  //   }
  //
  //   return this.playStateService.getEpisodePlayState(
  //     user,
  //     tmdbIdNumber,
  //     seasonNumberNumber,
  //     episodeNumberNumber,
  //   );
  // }
  //
  // @Put(':tmdbId')
  // @ApiOkResponse({ type: TitleDto })
  // async updatePlayState(
  //   @GetUser() user: User,
  //   @Param('tmdbId') tmdbId: number,
  //   @Body() playStateDto: UpdateTitleDto,
  // ): Promise<TitleDto> {
  //   const tmdbIdNumber = Number(tmdbId);
  //
  //   if (isNaN(tmdbIdNumber)) {
  //     throw new Error('Invalid tmdbId');
  //   }
  //
  //   return this.playStateService.updateOrCreatePlayState({
  //     user,
  //     tmdbId: tmdbIdNumber,
  //     updatePlayStateDto: playStateDto,
  //   });
  // }
  //
  // @Put(':tmdbId/season/:seasonNumber/episode/:episodeNumber')
  // @ApiOkResponse({ type: TitleDto })
  // async updateEpisodePlayState(
  //   @GetUser() user: User,
  //   @Param('tmdbId') tmdbId: number,
  //   @Param('seasonNumber') seasonNumber: number,
  //   @Param('episodeNumber') episodeNumber: number,
  //   @Body() playStateDto: UpdateTitleDto,
  // ): Promise<TitleDto> {
  //   const tmdbIdNumber = Number(tmdbId);
  //   const seasonNumberNumber = Number(seasonNumber);
  //   const episodeNumberNumber = Number(episodeNumber);
  //
  //   if (
  //     isNaN(tmdbIdNumber) ||
  //     isNaN(seasonNumberNumber) ||
  //     isNaN(episodeNumberNumber)
  //   ) {
  //     throw new Error('Invalid tmdbId, seasonNumber, or episodeNumber');
  //   }
  //
  //   return this.playStateService.updateOrCreatePlayState({
  //     user,
  //     tmdbId: tmdbIdNumber,
  //     seasonNumber: seasonNumberNumber,
  //     episodeNumber: episodeNumberNumber,
  //     updatePlayStateDto: playStateDto,
  //   });
  // }
}
