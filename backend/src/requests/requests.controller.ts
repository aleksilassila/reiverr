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
  MediaType,
  PaginatedResponseDto,
  PaginationDto,
  SuccessResponseDto,
} from '../common/common.dto.js';
import { User } from '../users/user.entity.js';
import {
  MediaRequestDto,
  MovieRequestRuleDto,
  MovieRequestStatusDto,
  RequestRuleDto,
  SetPreferenceDto,
  UpdateSeriesRequestsDto,
} from './requests.dto.js';
import { RequestsService, SelectionTarget } from './requests.service.js';

/** A limit of a rule: null for off, else a positive integer */
const isLimit = (value: unknown) =>
  value === null || (Number.isInteger(value) && (value as number) > 0);

@ApiTags('requests')
@Controller('me/requests')
@UseGuards(UserAccessControl)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  @PaginationApiQuery()
  @PaginatedApiOkResponse(MediaRequestDto)
  async getUserRequests(
    @GetAuthUser() user: User,
    @GetPaginationParams() pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<MediaRequestDto>> {
    return this.requestsService.findByUser(user.id, pagination);
  }

  @Get('movies/:tmdbId')
  @ApiOkResponse({ type: MovieRequestStatusDto })
  async getMovieRequest(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ): Promise<MovieRequestStatusDto> {
    const request = await this.requestsService.findMovieRequest(
      user.id,
      tmdbId,
    );

    return { tmdbId, request: request ?? undefined };
  }

  @Put('movies/:tmdbId')
  @ApiOkResponse({ type: MediaRequestDto })
  async createMovieRequest(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ): Promise<MediaRequestDto> {
    return this.requestsService.createMovieRequest(
      user.id,
      tmdbId,
      user.isAdmin,
    );
  }

  @Delete('movies/:tmdbId')
  @ApiOkResponse({ type: SuccessResponseDto })
  async deleteMovieRequest(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ): Promise<SuccessResponseDto> {
    const result = await this.requestsService.deleteMovieRequest(
      user.id,
      tmdbId,
    );

    return { success: result > 0 };
  }

  @Get('movies/:tmdbId/rule')
  @ApiOkResponse({ type: MovieRequestRuleDto })
  async getMovieRequestRule(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ): Promise<MovieRequestRuleDto> {
    const rule = await this.requestsService.findMovieRule(user.id, tmdbId);

    return { keepWatchedHours: rule?.keepWatchedHours ?? null };
  }

  @Put('movies/:tmdbId/rule')
  @ApiOkResponse({ type: MovieRequestRuleDto })
  async updateMovieRequestRule(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
    @Body() body: MovieRequestRuleDto,
  ): Promise<MovieRequestRuleDto> {
    if (!isLimit(body?.keepWatchedHours)) {
      throw new BadRequestException(
        'Expected { keepWatchedHours }, null or a positive integer',
      );
    }

    return this.requestsService.setMovieRule(user.id, tmdbId, body);
  }

  @Put('movies/:tmdbId/preference')
  @ApiOkResponse({
    type: SuccessResponseDto,
    description:
      'Makes a release the torrent the request of the user for the movie downloads from, or a file in the library what it has',
  })
  async setMoviePreference(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
    @Body() body: SetPreferenceDto,
  ): Promise<SuccessResponseDto> {
    const target = movieTarget(user.id, tmdbId);
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

  @Delete('movies/:tmdbId/preference')
  @ApiOkResponse({
    type: SuccessResponseDto,
    description:
      'Forgets the torrent or the file the user prefers for the movie',
  })
  async clearMoviePreference(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ): Promise<SuccessResponseDto> {
    const success = await this.requestsService.clearPreference(
      movieTarget(user.id, tmdbId),
    );

    return { success };
  }

  @Get('series/:tmdbId')
  @ApiOkResponse({ type: [MediaRequestDto] })
  async getSeriesRequests(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ): Promise<MediaRequestDto[]> {
    return this.requestsService.findSeriesRequests(user.id, tmdbId);
  }

  @Put('series/:tmdbId')
  @ApiOkResponse({ type: [MediaRequestDto] })
  async setSeriesRequests(
    @GetAuthUser() user: User,
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
      userId: user.id,
      tmdbId,
      episodes: body.episodes,
      requested: body.requested,
      approved: user.isAdmin,
    });
  }

  @Get('series/:tmdbId/rule')
  @ApiOkResponse({ type: RequestRuleDto })
  async getSeriesRequestRule(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ): Promise<RequestRuleDto> {
    const rule = await this.requestsService.findSeriesRule(user.id, tmdbId);

    return {
      keepNext: rule?.keepNext ?? null,
      keepWatched: rule?.keepWatched ?? null,
      keepWatchedHours: rule?.keepWatchedHours ?? null,
    };
  }

  @Put('series/:tmdbId/rule')
  @ApiOkResponse({ type: RequestRuleDto })
  async updateSeriesRequestRule(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
    @Body() body: RequestRuleDto,
  ): Promise<RequestRuleDto> {
    const isValid =
      isLimit(body?.keepNext) &&
      isLimit(body.keepWatched) &&
      isLimit(body.keepWatchedHours);
    if (!isValid) {
      throw new BadRequestException(
        'Expected { keepNext, keepWatched, keepWatchedHours }, each null or a positive integer',
      );
    }

    return this.requestsService.setSeriesRule(user.id, tmdbId, body);
  }

  @Put('series/:tmdbId/preferences/seasons/:season')
  @ApiOkResponse({
    type: SuccessResponseDto,
    description:
      'Makes a release the torrent the requests of the user for the season download from',
  })
  async setSeasonPreference(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Body() body: SetPreferenceDto,
  ): Promise<SuccessResponseDto> {
    if (typeof body?.releaseId !== 'string' || body.mediaFileId !== undefined) {
      throw new BadRequestException('Expected { releaseId }');
    }

    await this.requestsService.preferRelease(
      seriesTarget(user.id, tmdbId, season, 0),
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
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
  ): Promise<SuccessResponseDto> {
    const success = await this.requestsService.clearPreference(
      seriesTarget(user.id, tmdbId, season, 0),
    );

    return { success };
  }

  @Put('series/:tmdbId/preferences/seasons/:season/episodes/:episode')
  @ApiOkResponse({
    type: SuccessResponseDto,
    description:
      'Makes a release the torrent the requests of the user for the episode download from, or a file in the library what they have',
  })
  async setEpisodePreference(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
    @Body() body: SetPreferenceDto,
  ): Promise<SuccessResponseDto> {
    if (episode < 1) throw new BadRequestException('Invalid episode');
    const target = seriesTarget(user.id, tmdbId, season, episode);
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
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
  ): Promise<SuccessResponseDto> {
    if (episode < 1) throw new BadRequestException('Invalid episode');
    const success = await this.requestsService.clearPreference(
      seriesTarget(user.id, tmdbId, season, episode),
    );

    return { success };
  }
}

const seriesTarget = (
  userId: string,
  tmdbId: string,
  season: number,
  episode: number,
): SelectionTarget => ({
  userId,
  mediaType: MediaType.Series,
  tmdbId,
  season,
  episode,
});

const movieTarget = (userId: string, tmdbId: string): SelectionTarget => ({
  userId,
  mediaType: MediaType.Movie,
  tmdbId,
  season: 0,
  episode: 0,
});
