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
  MovieRequestStatusDto,
  RequestRuleDto,
  SetPreferenceDto,
  UpdateSeriesRequestsDto,
} from './requests.dto.js';
import { RequestsService, SelectionTarget } from './requests.service.js';

@ApiTags('requests')
@Controller('users/:userId/requests')
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

  @Get('movies/:tmdbId')
  @ApiOkResponse({ type: MovieRequestStatusDto })
  async getMovieRequest(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
  ): Promise<MovieRequestStatusDto> {
    const request = await this.requestsService.findMovieRequest(userId, tmdbId);

    return { tmdbId, request: request ?? undefined };
  }

  @Put('movies/:tmdbId')
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

  @Delete('movies/:tmdbId')
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

  @Get('series/:tmdbId')
  @ApiOkResponse({ type: [MediaRequestDto] })
  async getSeriesRequests(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
  ): Promise<MediaRequestDto[]> {
    return this.requestsService.findSeriesRequests(userId, tmdbId);
  }

  @Put('series/:tmdbId')
  @ApiOkResponse({ type: [MediaRequestDto] })
  async setSeriesRequests(
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

  @Get('series/:tmdbId/rule')
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

  @Put('series/:tmdbId/rule')
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

  @Put('series/:tmdbId/preferences/seasons/:season')
  @ApiOkResponse({
    type: SuccessResponseDto,
    description:
      'Makes a release the torrent the requests of the user for the season download from',
  })
  async setSeasonPreference(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Body() body: SetPreferenceDto,
  ): Promise<SuccessResponseDto> {
    if (typeof body?.releaseId !== 'string' || body.mediaFileId !== undefined) {
      throw new BadRequestException('Expected { releaseId }');
    }

    await this.requestsService.preferRelease(
      { userId, tmdbId, season, episode: 0 },
      body.releaseId,
    );

    return { success: true };
  }

  @Delete('series/:tmdbId/preferences/seasons/:season')
  @ApiOkResponse({
    type: SuccessResponseDto,
    description: 'Forgets the torrent the user prefers for the season',
  })
  async clearSeasonPreference(
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

  @Put('series/:tmdbId/preferences/seasons/:season/episodes/:episode')
  @ApiOkResponse({
    type: SuccessResponseDto,
    description:
      'Makes a release the torrent the requests of the user for the episode download from, or a file in the library what they have',
  })
  async setEpisodePreference(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
    @Body() body: SetPreferenceDto,
  ): Promise<SuccessResponseDto> {
    if (episode < 1) throw new BadRequestException('Invalid episode');
    const target = { userId, tmdbId, season, episode };
    const hasRelease = typeof body?.releaseId === 'string';
    const hasFile = typeof body?.mediaFileId === 'string';
    if (hasRelease === hasFile) {
      throw new BadRequestException(
        'Expected { releaseId } or { mediaFileId }',
      );
    }

    if (hasRelease) {
      await this.requestsService.preferRelease(target, body.releaseId);
    } else {
      await this.requestsService.preferFile(target, body.mediaFileId);
    }

    return { success: true };
  }

  @Delete('series/:tmdbId/preferences/seasons/:season/episodes/:episode')
  @ApiOkResponse({
    type: SuccessResponseDto,
    description:
      'Forgets the torrent or the file the user prefers for the episode',
  })
  async clearEpisodePreference(
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
}
