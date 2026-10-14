import {
  Body,
  Controller,
  Get,
  ParseEnumPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminAccessControl } from '../auth/auth.guard.js';
import {
  GetPaginationParams,
  PaginatedApiOkResponse,
  PaginationApiQuery,
} from '../common/common.decorator.js';
import { PaginatedResponseDto, PaginationDto } from '../common/common.dto.js';
import { LogType } from './log-entry.entity.js';
import { LogEntryDto, ServerLogSettingsDto } from './server-log.dto.js';
import { ServerLogService } from './server-log.service.js';

@ApiTags('server-log')
@Controller('server-log')
@UseGuards(AdminAccessControl)
export class ServerLogController {
  constructor(private readonly serverLogService: ServerLogService) {}

  @Get('entries')
  @ApiQuery({ name: 'type', enum: LogType, required: false })
  @PaginationApiQuery()
  @PaginatedApiOkResponse(LogEntryDto)
  getServerLogEntries(
    @GetPaginationParams() pagination: PaginationDto,
    @Query('type', new ParseEnumPipe(LogType, { optional: true }))
    type?: LogType,
  ): Promise<PaginatedResponseDto<LogEntryDto>> {
    return this.serverLogService.list(pagination, type);
  }

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
