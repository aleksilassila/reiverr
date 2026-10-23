import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
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
import {
  GetPaginationParams,
  PaginatedApiOkResponse,
  PaginationApiQuery,
} from '../common/common.decorator.js';
import {
  MediaType,
  OrderDirection,
  PaginatedResponseDto,
  PaginationDto,
} from '../common/common.dto.js';
import { User } from '../users/user.entity.js';
import { CatalogService } from './catalog.service.js';
import {
  LibraryEpisodeFileDto,
  LibraryFileDto,
  LibrarySettingsDto,
  LibraryTitleDto,
  LibraryTitlesOrder,
  LibraryTitlesStatus,
  SeriesStatusDto,
  StorageDto,
  StorageUsageDto,
  TitleUsageDto,
  TitleUsageSort,
} from './library.dto.js';
import { LibraryService } from './library.service.js';
import { PlaybackService } from './playback.service.js';
import { StatusService } from './status.service.js';
import { StorageService } from './storage.service.js';

@ApiTags('library')
@Controller('library')
@UseGuards(UserAccessControl)
export class LibraryController {
  constructor(
    private readonly libraryService: LibraryService,
    private readonly playbackService: PlaybackService,
    private readonly statusService: StatusService,
    private readonly storageService: StorageService,
    private readonly catalogService: CatalogService,
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

  @Get('storage/users/:userId')
  @ApiOkResponse({
    type: StorageUsageDto,
    description: 'The quota of the user and what their requests take',
  })
  getUserStorage(@Param('userId') userId: string): Promise<StorageUsageDto> {
    return this.storageService.describeUser(userId);
  }

  @Get('storage/users/:userId/titles')
  @ApiQuery({ name: 'mediaType', enum: MediaType, required: false })
  @ApiQuery({ name: 'sort', enum: TitleUsageSort, required: false })
  @ApiQuery({
    name: 'direction',
    enum: OrderDirection,
    required: false,
    description: 'Without it, the direction natural to the sort',
  })
  @PaginationApiQuery()
  @PaginatedApiOkResponse(TitleUsageDto)
  getUserTitles(
    @Param('userId') userId: string,
    @GetPaginationParams() pagination: PaginationDto,
    @Query('mediaType', new ParseEnumPipe(MediaType, { optional: true }))
    mediaType?: MediaType,
    @Query('sort', new ParseEnumPipe(TitleUsageSort, { optional: true }))
    sort?: TitleUsageSort,
    @Query('direction', new ParseEnumPipe(OrderDirection, { optional: true }))
    direction?: OrderDirection,
  ): Promise<PaginatedResponseDto<TitleUsageDto>> {
    return this.storageService.describeUserTitles(userId, {
      mediaType,
      sort: sort ?? TitleUsageSort.Size,
      direction,
      pagination,
    });
  }

  @Get('titles')
  @ApiQuery({ name: 'mediaType', enum: MediaType, required: false })
  @ApiQuery({ name: 'status', enum: LibraryTitlesStatus, required: false })
  @ApiQuery({ name: 'order', enum: LibraryTitlesOrder, required: false })
  @ApiQuery({
    name: 'direction',
    enum: OrderDirection,
    required: false,
    description: 'Without it, the direction natural to the order',
  })
  @PaginationApiQuery()
  @PaginatedApiOkResponse(LibraryTitleDto)
  getTitles(
    @GetAuthUser() user: User,
    @GetPaginationParams() pagination: PaginationDto,
    @Query('mediaType', new ParseEnumPipe(MediaType, { optional: true }))
    mediaType?: MediaType,
    @Query('status', new ParseEnumPipe(LibraryTitlesStatus, { optional: true }))
    status?: LibraryTitlesStatus,
    @Query('order', new ParseEnumPipe(LibraryTitlesOrder, { optional: true }))
    order?: LibraryTitlesOrder,
    @Query('direction', new ParseEnumPipe(OrderDirection, { optional: true }))
    direction?: OrderDirection,
  ): Promise<PaginatedResponseDto<LibraryTitleDto>> {
    return this.catalogService.findTitles(user.id, {
      mediaType,
      status,
      order: order ?? LibraryTitlesOrder.DateAdded,
      direction,
      pagination,
    });
  }

  @Get('movies/:tmdbId')
  @ApiOkResponse({ type: [LibraryFileDto] })
  getMovieFiles(@Param('tmdbId') tmdbId: string): Promise<LibraryFileDto[]> {
    return this.playbackService.listMovieFiles(tmdbId);
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
