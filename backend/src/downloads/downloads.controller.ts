import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminAccessControl, UserAccessControl } from '../auth/auth.guard.js';
import { SuccessResponseDto } from '../common/common.dto.js';
import {
  DownloadSettingsDto,
  SelectReleaseDto,
  SeriesDownloadsDto,
  TorrentSelectionDto,
} from './downloads.dto.js';
import { DownloadsService } from './downloads.service.js';

@ApiTags('downloads')
@Controller('v2/downloads')
@UseGuards(UserAccessControl)
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) {}

  @Get('settings')
  @UseGuards(AdminAccessControl)
  @ApiOkResponse({ type: DownloadSettingsDto })
  getDownloadSettings(): Promise<DownloadSettingsDto> {
    return this.downloadsService.getSettings();
  }

  @Put('settings')
  @UseGuards(AdminAccessControl)
  @ApiOkResponse({ type: DownloadSettingsDto })
  updateDownloadSettings(
    @Body() settings: DownloadSettingsDto,
  ): Promise<DownloadSettingsDto> {
    return this.downloadsService.updateSettings(settings);
  }

  @Get('series/:tmdbId')
  @ApiOkResponse({ type: SeriesDownloadsDto })
  getSeriesDownloads(
    @Param('tmdbId') tmdbId: string,
  ): Promise<SeriesDownloadsDto> {
    return this.downloadsService.getSeriesDownloads(tmdbId);
  }

  @Put('series/:tmdbId/seasons/:season/selection')
  @ApiOkResponse({ type: TorrentSelectionDto })
  selectSeasonRelease(
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Body() body: SelectReleaseDto,
  ): Promise<TorrentSelectionDto> {
    return this.selectRelease(tmdbId, season, 0, body);
  }

  @Delete('series/:tmdbId/seasons/:season/selection')
  @ApiOkResponse({ type: SuccessResponseDto })
  async clearSeasonRelease(
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
  ): Promise<SuccessResponseDto> {
    return {
      success: await this.downloadsService.clearSelection(tmdbId, season, 0),
    };
  }

  @Put('series/:tmdbId/seasons/:season/episodes/:episode/selection')
  @ApiOkResponse({ type: TorrentSelectionDto })
  selectEpisodeRelease(
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
    @Body() body: SelectReleaseDto,
  ): Promise<TorrentSelectionDto> {
    if (episode < 1) throw new BadRequestException('Invalid episode');

    return this.selectRelease(tmdbId, season, episode, body);
  }

  @Delete('series/:tmdbId/seasons/:season/episodes/:episode/selection')
  @ApiOkResponse({ type: SuccessResponseDto })
  async clearEpisodeRelease(
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
  ): Promise<SuccessResponseDto> {
    return {
      success: await this.downloadsService.clearSelection(
        tmdbId,
        season,
        episode,
      ),
    };
  }

  private selectRelease(
    tmdbId: string,
    season: number,
    episode: number,
    body: SelectReleaseDto,
  ): Promise<TorrentSelectionDto> {
    if (typeof body?.releaseId !== 'string') {
      throw new BadRequestException('Expected { releaseId }');
    }

    return this.downloadsService.selectRelease(
      tmdbId,
      season,
      episode,
      body.releaseId,
    );
  }
}
