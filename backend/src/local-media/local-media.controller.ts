import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AdminAccessControl, UserAccessControl } from '../auth/auth.guard.js';
import {
  LocalEpisodeFileDto,
  LocalMediaFileDto,
  LocalMediaSettingsDto,
} from './local-media.dto.js';
import { LocalMediaService } from './local-media.service.js';

@ApiTags('local-media')
@Controller('v2/local-media')
@UseGuards(UserAccessControl)
export class LocalMediaController {
  constructor(private readonly localMediaService: LocalMediaService) {}

  @Get('settings')
  @UseGuards(AdminAccessControl)
  @ApiOkResponse({ type: LocalMediaSettingsDto })
  getLocalMediaSettings(): Promise<LocalMediaSettingsDto> {
    return this.localMediaService.getSettings();
  }

  @Put('settings')
  @UseGuards(AdminAccessControl)
  @ApiOkResponse({ type: LocalMediaSettingsDto })
  updateLocalMediaSettings(
    @Body() settings: LocalMediaSettingsDto,
  ): Promise<LocalMediaSettingsDto> {
    return this.localMediaService.updateSettings(settings);
  }

  @Get('movies/:tmdbId')
  @ApiOkResponse({ type: [LocalMediaFileDto] })
  getMovieFiles(@Param('tmdbId') tmdbId: string): Promise<LocalMediaFileDto[]> {
    return this.localMediaService.getMovieFiles(tmdbId);
  }

  @Get('series/:tmdbId')
  @ApiOkResponse({ type: [LocalEpisodeFileDto] })
  getSeriesFiles(
    @Param('tmdbId') tmdbId: string,
  ): Promise<LocalEpisodeFileDto[]> {
    return this.localMediaService.getSeriesFiles(tmdbId);
  }

  @Get('series/:tmdbId/seasons/:season/episodes/:episode')
  @ApiOkResponse({ type: [LocalEpisodeFileDto] })
  getEpisodeFiles(
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
  ): Promise<LocalEpisodeFileDto[]> {
    return this.localMediaService.getEpisodeFiles(tmdbId, season, episode);
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
      .send(await this.localMediaService.readSubtitles(id, fileName));
  }

  @Get('files/:id/stream')
  @ApiOkResponse({
    description:
      'The video file. Supports range requests; pass the token as the reiverr_token query parameter.',
  })
  async streamFile(@Param('id') id: string, @Res() res: Response) {
    const filePath = await this.localMediaService.resolveFilePath(id);
    res.sendFile(filePath);
  }
}
