import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  AdminAccessControl,
  GetAuthUser,
  UserAccessControl,
} from '../auth/auth.guard.js';
import { SuccessResponseDto } from '../common/common.dto.js';
import { User } from '../users/user.entity.js';
import {
  DownloadSettingsDto,
  SelectReleaseDto,
  SeriesDownloadsDto,
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
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ): Promise<SeriesDownloadsDto> {
    return this.downloadsService.getSeriesDownloads(user.id, tmdbId);
  }

  @Put('series/:tmdbId/seasons/:season/selection')
  @ApiOkResponse({ type: SuccessResponseDto })
  selectSeasonRelease(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Body() body: SelectReleaseDto,
  ): Promise<SuccessResponseDto> {
    return this.selectRelease(user, tmdbId, season, 0, body);
  }

  @Delete('series/:tmdbId/seasons/:season/selection')
  @ApiOkResponse({ type: SuccessResponseDto })
  async clearSeasonRelease(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
  ): Promise<SuccessResponseDto> {
    return {
      success: await this.downloadsService.clearSelection(
        user.id,
        tmdbId,
        season,
        0,
      ),
    };
  }

  @Put('series/:tmdbId/seasons/:season/episodes/:episode/selection')
  @ApiOkResponse({ type: SuccessResponseDto })
  selectEpisodeRelease(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
    @Body() body: SelectReleaseDto,
  ): Promise<SuccessResponseDto> {
    if (episode < 1) throw new BadRequestException('Invalid episode');

    return this.selectRelease(user, tmdbId, season, episode, body);
  }

  @Delete('series/:tmdbId/seasons/:season/episodes/:episode/selection')
  @ApiOkResponse({ type: SuccessResponseDto })
  async clearEpisodeRelease(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
  ): Promise<SuccessResponseDto> {
    return {
      success: await this.downloadsService.clearSelection(
        user.id,
        tmdbId,
        season,
        episode,
      ),
    };
  }

  @Post('torrents/:torrentId/retry')
  @HttpCode(200)
  @ApiOkResponse({ type: SuccessResponseDto })
  async retryTorrent(
    @Param('torrentId') torrentId: string,
  ): Promise<SuccessResponseDto> {
    await this.downloadsService.retryTorrent(torrentId);

    return { success: true };
  }

  private async selectRelease(
    user: User,
    tmdbId: string,
    season: number,
    episode: number,
    body: SelectReleaseDto,
  ): Promise<SuccessResponseDto> {
    if (typeof body?.releaseId !== 'string') {
      throw new BadRequestException('Expected { releaseId }');
    }

    await this.downloadsService.selectRelease(
      user.id,
      tmdbId,
      season,
      episode,
      body.releaseId,
    );

    return { success: true };
  }
}
