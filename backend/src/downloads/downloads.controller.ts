import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminAccessControl } from '../auth/auth.guard.js';
import { DownloadSettingsDto, TorrentWithItemsDto } from './downloads.dto.js';
import { DownloadsService } from './downloads.service.js';

@ApiTags('downloads')
@Controller('downloads')
@UseGuards(AdminAccessControl)
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) {}

  @Get('settings')
  @ApiOkResponse({ type: DownloadSettingsDto })
  getDownloadSettings(): Promise<DownloadSettingsDto> {
    return this.downloadsService.getSettings();
  }

  @Put('settings')
  @ApiOkResponse({ type: DownloadSettingsDto })
  updateDownloadSettings(
    @Body() settings: DownloadSettingsDto,
  ): Promise<DownloadSettingsDto> {
    return this.downloadsService.updateSettings(settings);
  }

  @Get('torrents')
  @ApiOkResponse({
    type: [TorrentWithItemsDto],
    description: 'Every torrent the server knows, with what is wanted of it',
  })
  getTorrents(): Promise<TorrentWithItemsDto[]> {
    return this.downloadsService.describeTorrents();
  }
}
