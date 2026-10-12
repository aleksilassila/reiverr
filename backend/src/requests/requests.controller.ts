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
import { GetAuthUser, UserAccessControl } from '../auth/auth.guard.js';
import {
  GetPaginationParams,
  PaginatedApiOkResponse,
  PaginationApiQuery,
} from '../common/common.decorator.js';
import {
  PaginatedResponseDto,
  PaginationDto,
  SuccessResponseDto,
} from '../common/common.dto.js';
import { User } from '../users/user.entity.js';
import {
  MediaRequestDto,
  MovieRequestDto,
  RequestRuleDto,
  SelectFileDto,
  SelectReleaseDto,
  UpdateSeriesRequestsDto,
} from './requests.dto.js';
import { RequestsService, SelectionTarget } from './requests.service.js';

@ApiTags('requests')
@Controller('v2/users/:userId/requests')
@UseGuards(UserAccessControl)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  @PaginationApiQuery()
  @PaginatedApiOkResponse(MediaRequestDto)
  async getUserRequests(
    @Param('userId') userId: string,
    @GetPaginationParams() pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<MediaRequestDto>> {
    return this.requestsService.findByUser(userId, pagination);
  }

  @Get('movie/tmdb/:tmdbId')
  @ApiOkResponse({ type: MovieRequestDto })
  async getMovieRequest(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
  ): Promise<MovieRequestDto> {
    const request = await this.requestsService.findMovieRequest(userId, tmdbId);

    return { tmdbId, request: request ?? undefined };
  }

  @Put('movie/tmdb/:tmdbId')
  @ApiOkResponse({ type: MediaRequestDto })
  async createMovieRequest(
    @GetAuthUser() user: User,
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
  ): Promise<MediaRequestDto> {
    return this.requestsService.createMovieRequest(
      userId,
      tmdbId,
      user.isAdmin,
    );
  }

  @Delete('movie/tmdb/:tmdbId')
  @ApiOkResponse({ type: SuccessResponseDto })
  async deleteMovieRequest(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
  ): Promise<SuccessResponseDto> {
    const result = await this.requestsService.deleteMovieRequest(
      userId,
      tmdbId,
    );

    return { success: result > 0 };
  }

  @Get('series/tmdb/:tmdbId')
  @ApiOkResponse({ type: [MediaRequestDto] })
  async getSeriesRequests(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
  ): Promise<MediaRequestDto[]> {
    return this.requestsService.findSeriesRequests(userId, tmdbId);
  }

  @Put('series/tmdb/:tmdbId')
  @ApiOkResponse({ type: [MediaRequestDto] })
  async updateSeriesRequests(
    @GetAuthUser() user: User,
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
    @Body() body: UpdateSeriesRequestsDto,
  ): Promise<MediaRequestDto[]> {
    const isValid =
      typeof body?.requested === 'boolean' &&
      Array.isArray(body.episodes) &&
      body.episodes.every(
        (e) => Number.isInteger(e?.season) && Number.isInteger(e?.episode),
      );
    if (!isValid) {
      throw new BadRequestException(
        'Expected { episodes: [{ season, episode }], requested }',
      );
    }

    return this.requestsService.setEpisodeRequests({
      userId,
      tmdbId,
      episodes: body.episodes,
      requested: body.requested,
      approved: user.isAdmin,
    });
  }

  @Get('series/tmdb/:tmdbId/rule')
  @ApiOkResponse({ type: RequestRuleDto })
  async getSeriesRequestRule(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
  ): Promise<RequestRuleDto> {
    const rule = await this.requestsService.findSeriesRule(userId, tmdbId);

    return {
      keepNext: rule?.keepNext ?? null,
      keepWatched: rule?.keepWatched ?? null,
      keepWatchedHours: rule?.keepWatchedHours ?? null,
    };
  }

  @Put('series/tmdb/:tmdbId/rule')
  @ApiOkResponse({ type: RequestRuleDto })
  async updateSeriesRequestRule(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
    @Body() body: RequestRuleDto,
  ): Promise<RequestRuleDto> {
    const isLimit = (value: unknown) =>
      value === null || (Number.isInteger(value) && (value as number) > 0);
    const isValid =
      isLimit(body?.keepNext) &&
      isLimit(body.keepWatched) &&
      isLimit(body.keepWatchedHours);
    if (!isValid) {
      throw new BadRequestException(
        'Expected { keepNext, keepWatched, keepWatchedHours }, each null or a positive integer',
      );
    }

    return this.requestsService.setSeriesRule(userId, tmdbId, body);
  }

  @Put('series/tmdb/:tmdbId/rule/seasons/:season/torrent')
  @ApiOkResponse({ type: SuccessResponseDto })
  async selectSeasonRelease(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Body() body: SelectReleaseDto,
  ): Promise<SuccessResponseDto> {
    return this.selectRelease({ userId, tmdbId, season, episode: 0 }, body);
  }

  @Delete('series/tmdb/:tmdbId/rule/seasons/:season/torrent')
  @ApiOkResponse({ type: SuccessResponseDto })
  async clearSeasonRelease(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
  ): Promise<SuccessResponseDto> {
    const success = await this.requestsService.clearPreference({
      userId,
      tmdbId,
      season,
      episode: 0,
    });

    return { success };
  }

  @Put('series/tmdb/:tmdbId/rule/seasons/:season/episodes/:episode/torrent')
  @ApiOkResponse({ type: SuccessResponseDto })
  async selectEpisodeRelease(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
    @Body() body: SelectReleaseDto,
  ): Promise<SuccessResponseDto> {
    if (episode < 1) throw new BadRequestException('Invalid episode');

    return this.selectRelease({ userId, tmdbId, season, episode }, body);
  }

  @Delete('series/tmdb/:tmdbId/rule/seasons/:season/episodes/:episode/torrent')
  @ApiOkResponse({
    type: SuccessResponseDto,
    description:
      'Forgets the torrent or the file the user prefers for the episode',
  })
  async clearEpisodeRelease(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
  ): Promise<SuccessResponseDto> {
    if (episode < 1) throw new BadRequestException('Invalid episode');
    const success = await this.requestsService.clearPreference({
      userId,
      tmdbId,
      season,
      episode,
    });

    return { success };
  }

  @Put('series/tmdb/:tmdbId/rule/seasons/:season/episodes/:episode/file')
  @ApiOkResponse({
    type: SuccessResponseDto,
    description:
      'Makes a file in the library what the requests of the user for the episode have',
  })
  async selectEpisodeFile(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
    @Body() body: SelectFileDto,
  ): Promise<SuccessResponseDto> {
    if (episode < 1) throw new BadRequestException('Invalid episode');
    if (typeof body?.mediaFileId !== 'string' || !body.mediaFileId) {
      throw new BadRequestException('Expected { mediaFileId }');
    }

    await this.requestsService.selectFile(
      { userId, tmdbId, season, episode },
      body.mediaFileId,
    );

    return { success: true };
  }

  private async selectRelease(
    target: SelectionTarget,
    body: SelectReleaseDto,
  ): Promise<SuccessResponseDto> {
    if (typeof body?.releaseId !== 'string') {
      throw new BadRequestException('Expected { releaseId }');
    }

    await this.requestsService.selectTorrent(target, body.releaseId);

    return { success: true };
  }
}
