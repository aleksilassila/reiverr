import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import {
  AdminAccessControl,
  GetAuthUser,
  UserAccessControl,
} from '../auth/auth.guard.js';
import { User } from '../users/user.entity.js';
import {
  LibraryEpisodeFileDto,
  LibraryFileDto,
  LibraryFolderDto,
  LibrarySettingsDto,
  MovieStatusDto,
  SeriesStatusDto,
  StorageDto,
} from './library.dto.js';
import { LibraryService } from './library.service.js';
import { PlaybackService } from './playback.service.js';
import { StatusService } from './status.service.js';
import { StorageService } from './storage.service.js';

@ApiTags('library')
@ApiExtraModels(LibraryFolderDto)
@Controller('library')
@UseGuards(UserAccessControl)
export class LibraryController {
  constructor(
    private readonly libraryService: LibraryService,
    private readonly playbackService: PlaybackService,
    private readonly statusService: StatusService,
    private readonly storageService: StorageService,
  ) {}

  @Get('settings')
  @UseGuards(AdminAccessControl)
  @ApiOkResponse({ type: LibrarySettingsDto })
  getLibrarySettings(): Promise<LibrarySettingsDto> {
    return this.libraryService.getSettings();
  }

  @Put('settings')
  @UseGuards(AdminAccessControl)
  @ApiQuery({
    name: 'force',
    type: Boolean,
    required: false,
    description:
      'Removes library folders that have indexed files in them, forgetting the files',
  })
  @ApiOkResponse({ type: LibrarySettingsDto })
  updateLibrarySettings(
    @Body() settings: LibrarySettingsDto,
    @Query('force') force?: string,
  ): Promise<LibrarySettingsDto> {
    return this.libraryService.updateSettings(settings, {
      forgetFiles: force === 'true',
    });
  }

  @Get('storage')
  @UseGuards(AdminAccessControl)
  @ApiOkResponse({
    type: StorageDto,
    description:
      'The disks the files go to, the disk limit, and what the requests of every user take',
  })
  getStorage(): Promise<StorageDto> {
    return this.storageService.describe();
  }

  @Get('movies/:tmdbId')
  @ApiOkResponse({ type: [LibraryFileDto] })
  getMovieFiles(@Param('tmdbId') tmdbId: string): Promise<LibraryFileDto[]> {
    return this.playbackService.listMovieFiles(tmdbId);
  }

  @Get('movies/:tmdbId/status')
  @ApiOkResponse({
    type: MovieStatusDto,
    description:
      'Where the request and the preferred source of the user stand for the movie',
  })
  getMovieStatus(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ): Promise<MovieStatusDto> {
    return this.statusService.getMovieStatus(user.id, tmdbId);
  }

  @Get('series/:tmdbId')
  @ApiOkResponse({ type: [LibraryEpisodeFileDto] })
  getSeriesFiles(
    @Param('tmdbId') tmdbId: string,
  ): Promise<LibraryEpisodeFileDto[]> {
    return this.playbackService.listSeriesFiles(tmdbId);
  }

  @Get('series/:tmdbId/status')
  @ApiOkResponse({
    type: SeriesStatusDto,
    description:
      'Where the requests and the preferred sources of the user stand for the series',
  })
  getSeriesStatus(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ): Promise<SeriesStatusDto> {
    return this.statusService.getSeriesStatus(user.id, tmdbId);
  }

  @Get('series/:tmdbId/seasons/:season/episodes/:episode')
  @ApiOkResponse({ type: [LibraryEpisodeFileDto] })
  getEpisodeFiles(
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
  ): Promise<LibraryEpisodeFileDto[]> {
    return this.playbackService.listEpisodeFiles(tmdbId, season, episode);
  }

  @Get('files/:id/subtitles/:fileName')
  @ApiOkResponse({
    description: 'A subtitle file next to the video, as WebVTT',
  })
  async getSubtitles(
    @Param('id') id: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    res
      .type('text/vtt')
      .send(await this.playbackService.readSubtitles(id, fileName));
  }

  @Get('files/:id/stream')
  @ApiOkResponse({
    description:
      'The video file. Supports range requests; pass the token as the reiverr_token query parameter.',
  })
  async streamFile(@Param('id') id: string, @Res() res: Response) {
    const filePath = await this.playbackService.getStreamPath(id);
    res.sendFile(filePath);
  }
}
