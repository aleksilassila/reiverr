import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
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
import { DownloadSettingsDto, SeriesStatusDto } from './downloads.dto.js';
import { DownloadsService } from './downloads.service.js';

@ApiTags('downloads')
@Controller('downloads')
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
  @ApiOkResponse({ type: SeriesStatusDto })
  getSeriesStatus(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ): Promise<SeriesStatusDto> {
    return this.downloadsService.getSeriesStatus(user.id, tmdbId);
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
}
