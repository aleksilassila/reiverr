import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
  UpdateSeriesRequestsDto,
} from './requests.dto.js';
import { RequestsService } from './requests.service.js';

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
}
