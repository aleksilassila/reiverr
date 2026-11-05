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
import { MediaType, SuccessResponseDto } from '../common/common.dto.js';
import { User } from '../users/user.entity.js';
import {
  MediaRequestDto,
  MovieRequestRuleDto,
  MovieRequestsDto,
  RequestRuleDto,
  SeriesRequestsDto,
  SetRequestSourceDto,
  UpdateSeriesRequestsDto,
} from './requests.dto.js';
import {
  RequestSourcesService,
  SelectionTarget,
} from './request-sources.service.js';
import { RequestsService } from './requests.service.js';

/** A limit of a rule: null for off, else a positive integer */
const isLimit = (value: unknown) =>
  value === null || (Number.isInteger(value) && (value as number) > 0);

@ApiTags('requests')
@Controller('me/requests')
@UseGuards(UserAccessControl)
export class RequestsController {
  constructor(
    private readonly requestsService: RequestsService,
    private readonly requestSourcesService: RequestSourcesService,
  ) {}

  @Get('movies/:tmdbId')
  @ApiOkResponse({
    type: MovieRequestsDto,
    description:
      'The request of the user for the movie, with the rule and the source it is fulfilled by',
  })
  getMovieRequests(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ): Promise<MovieRequestsDto> {
    return this.requestsService.describeMovieRequests(user.id, tmdbId);
  }

  @Put('movies/:tmdbId')
  @ApiOkResponse({ type: MediaRequestDto })
  async createMovieRequest(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ): Promise<MediaRequestDto> {
    return this.requestsService.createMovieRequest(user.id, tmdbId);
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

    const { keepWatchedHours } = await this.requestsService.setRule(
      { userId: user.id, mediaType: MediaType.Movie, tmdbId },
      {
        keepNext: null,
        keepWatched: null,
        keepWatchedHours: body.keepWatchedHours,
      },
    );

    return { keepWatchedHours };
  }

  @Put('movies/:tmdbId/source')
  @ApiOkResponse({
    type: SuccessResponseDto,
    description:
      'Makes a release the torrent the request of the user for the movie downloads from, or a file in the library what it has',
  })
  async setMovieSource(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
    @Body() body: SetRequestSourceDto,
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
      await this.requestSourcesService.selectRelease(target, body.releaseId);
    } else {
      await this.requestSourcesService.selectFile(target, body.mediaFileId);
    }

    return { success: true };
  }

  @Delete('movies/:tmdbId/source')
  @ApiOkResponse({
    type: SuccessResponseDto,
    description:
      'Forgets the torrent or the file the user selected for the movie',
  })
  async clearMovieSource(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ): Promise<SuccessResponseDto> {
    const success = await this.requestSourcesService.clearSelection(
      movieTarget(user.id, tmdbId),
    );

    return { success };
  }

  @Get('series/:tmdbId')
  @ApiOkResponse({
    type: SeriesRequestsDto,
    description:
      'The requests of the user for the series, with the rule and the sources they are fulfilled by',
  })
  getSeriesRequests(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
  ): Promise<SeriesRequestsDto> {
    return this.requestsService.describeSeriesRequests(user.id, tmdbId);
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
    });
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

    return this.requestsService.setRule(
      { userId: user.id, mediaType: MediaType.Series, tmdbId },
      body,
    );
  }

  @Put('series/:tmdbId/sources/seasons/:season')
  @ApiOkResponse({
    type: SuccessResponseDto,
    description:
      'Makes a release the torrent the requests of the user for the season download from',
  })
  async setSeasonSource(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Body() body: SetRequestSourceDto,
  ): Promise<SuccessResponseDto> {
    if (typeof body?.releaseId !== 'string' || body.mediaFileId !== undefined) {
      throw new BadRequestException('Expected { releaseId }');
    }

    await this.requestSourcesService.selectRelease(
      seriesTarget(user.id, tmdbId, season, 0),
      body.releaseId,
    );

    return { success: true };
  }

  @Delete('series/:tmdbId/sources/seasons/:season')
  @ApiOkResponse({
    type: SuccessResponseDto,
    description: 'Forgets the torrent the user selected for the season',
  })
  async clearSeasonSource(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
  ): Promise<SuccessResponseDto> {
    const success = await this.requestSourcesService.clearSelection(
      seriesTarget(user.id, tmdbId, season, 0),
    );

    return { success };
  }

  @Put('series/:tmdbId/sources/seasons/:season/episodes/:episode')
  @ApiOkResponse({
    type: SuccessResponseDto,
    description:
      'Makes a release the torrent the requests of the user for the episode download from, or a file in the library what they have',
  })
  async setEpisodeSource(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
    @Body() body: SetRequestSourceDto,
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
      await this.requestSourcesService.selectRelease(target, body.releaseId);
    } else {
      await this.requestSourcesService.selectFile(target, body.mediaFileId);
    }

    return { success: true };
  }

  @Delete('series/:tmdbId/sources/seasons/:season/episodes/:episode')
  @ApiOkResponse({
    type: SuccessResponseDto,
    description:
      'Forgets the torrent or the file the user selected for the episode',
  })
  async clearEpisodeSource(
    @GetAuthUser() user: User,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
  ): Promise<SuccessResponseDto> {
    if (episode < 1) throw new BadRequestException('Invalid episode');
    const success = await this.requestSourcesService.clearSelection(
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
