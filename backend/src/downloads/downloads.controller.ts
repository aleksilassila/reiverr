import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminAccessControl, UserAccessControl } from '../auth/auth.guard.js';
import { MediaType } from '../common/common.dto.js';
import { DownloadSettingsDto, TorrentWithItemsDto } from './downloads.dto.js';
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

  @Get('torrents')
  @UseGuards(AdminAccessControl)
  @ApiOkResponse({
    type: [TorrentWithItemsDto],
    description: 'Every torrent the server knows, with what is wanted of it',
  })
  getTorrents(): Promise<TorrentWithItemsDto[]> {
    return this.downloadsService.describeTorrents();
  }

  @Get('movies/:tmdbId')
  @ApiOkResponse({
    type: [TorrentWithItemsDto],
    description:
      'The torrents the movie is or was wanted from, as the engine has them, with the items of the movie',
  })
  getMovieTorrents(
    @Param('tmdbId') tmdbId: string,
  ): Promise<TorrentWithItemsDto[]> {
    return this.downloadsService.describeTitleTorrents({
      mediaType: MediaType.Movie,
      tmdbId,
    });
  }

  @Get('series/:tmdbId')
  @ApiOkResponse({
    type: [TorrentWithItemsDto],
    description:
      'The torrents episodes of the series are or were wanted from, as the engine has them, with the items of the series',
  })
  getSeriesTorrents(
    @Param('tmdbId') tmdbId: string,
  ): Promise<TorrentWithItemsDto[]> {
    return this.downloadsService.describeTitleTorrents({
      mediaType: MediaType.Series,
      tmdbId,
    });
  }
}
