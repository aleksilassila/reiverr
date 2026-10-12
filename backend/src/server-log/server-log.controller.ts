import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminAccessControl } from '../auth/auth.guard.js';
import { ServerLogSettingsDto } from './server-log.dto.js';
import { ServerLogService } from './server-log.service.js';

@ApiTags('server-log')
@Controller('server-log')
@UseGuards(AdminAccessControl)
export class ServerLogController {
  constructor(private readonly serverLogService: ServerLogService) {}

  @Get('settings')
  @ApiOkResponse({ type: ServerLogSettingsDto })
  getServerLogSettings(): Promise<ServerLogSettingsDto> {
    return this.serverLogService.getSettings();
  }

  @Put('settings')
  @ApiOkResponse({ type: ServerLogSettingsDto })
  updateServerLogSettings(
    @Body() settings: ServerLogSettingsDto,
  ): Promise<ServerLogSettingsDto> {
    return this.serverLogService.updateSettings(settings);
  }
}
