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
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
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
  LibrarySettingsDto,
  SeriesStatusDto,
} from './library.dto.js';
import { LibraryService } from './library.service.js';
import { StatusService } from './status.service.js';

@ApiTags('library')
@Controller('library')
@UseGuards(UserAccessControl)
export class LibraryController {
  constructor(
    private readonly libraryService: LibraryService,
    private readonly statusService: StatusService,
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

  @Get('movies/:tmdbId')
  @ApiOkResponse({ type: [LibraryFileDto] })
  getMovieFiles(@Param('tmdbId') tmdbId: string): Promise<LibraryFileDto[]> {
    return this.libraryService.listMovieFiles(tmdbId);
  }

  @Get('series/:tmdbId')
  @ApiOkResponse({ type: [LibraryEpisodeFileDto] })
  getSeriesFiles(
    @Param('tmdbId') tmdbId: string,
  ): Promise<LibraryEpisodeFileDto[]> {
    return this.libraryService.listSeriesFiles(tmdbId);
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
    return this.libraryService.listEpisodeFiles(tmdbId, season, episode);
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
      .send(await this.libraryService.readSubtitles(id, fileName));
  }

  @Get('files/:id/stream')
  @ApiOkResponse({
    description:
      'The video file. Supports range requests; pass the token as the reiverr_token query parameter.',
  })
  async streamFile(@Param('id') id: string, @Res() res: Response) {
    const filePath = await this.libraryService.getStreamPath(id);
    res.sendFile(filePath);
  }
}
