import {
  EpisodeMetadata,
  MovieMetadata,
  SourceProvider,
  SourceProviderError,
} from '@aleksilassila/reiverr-plugin';
import {
  All,
  BadRequestException,
  Body,
  CanActivate,
  Controller,
  ExecutionContext,
  Get,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  GetAuthToken,
  GetAuthUser,
  UserAccessControl,
} from 'src/auth/auth.guard';
import {
  GetPaginationParams,
  PaginatedApiOkResponse,
} from 'src/common/common.decorator';
import {
  PaginatedResponseDto,
  PaginationParamsDto,
} from 'src/common/common.dto';
import { MetadataService } from 'src/metadata/metadata.service';
import {
  IndexItemDto,
  PlaybackConfigDto,
  StreamCandidatesDto,
  StreamDto,
} from 'src/source-providers/source-provider.dto';
import { SourceProvidersService } from 'src/source-providers/source-providers.service';
import { User } from 'src/users/user.entity';
import { MediaSource } from './media-source.entity';
import { MediaSourcesService } from './media-sources.service';

type MediaSourceConnection = {
  provider: SourceProvider;
  mediaSource: MediaSource;
};

@Injectable()
export class ServiceOwnershipValidator implements CanActivate {
  constructor(private mediaSourcesService: MediaSourcesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as User;

    if (!user) return true;

    const sourceId = request.params.sourceId;

    if (!sourceId) return true;

    const mediaSource =
      await this.mediaSourcesService.findMediaSource(sourceId);

    if (!mediaSource) throw new NotFoundException('Source not found');

    if (mediaSource.userId !== user.id && !user.isAdmin) {
      throw new UnauthorizedException();
    }

    return true;
  }
}

@ApiTags('sources')
@Controller('sources')
@UseGuards(UserAccessControl, ServiceOwnershipValidator)
export class MediaSourcesController {
  constructor(
    private mediaSourcesService: MediaSourcesService,
    private sourceProvidersService: SourceProvidersService,
    private metadataService: MetadataService,
  ) {}

  @Get(':sourceId/catalogue/movies')
  @PaginatedApiOkResponse(IndexItemDto)
  async getMovieCatalogue(
    @GetAuthUser() user: User,
    @Param('sourceId')
    sourceId: string,
    @GetAuthToken() token: string,
    @GetPaginationParams() pagination: PaginationParamsDto,
  ): Promise<PaginatedResponseDto<IndexItemDto>> {
    const connection = await this.getConnection(sourceId);

    const catalogue = await connection.provider.getMovieCatalogue?.(
      {
        userId: user.id,
        settings: connection.mediaSource.pluginSettings,
        token,
        sourceId: connection.mediaSource.id,
      },
      pagination,
    );

    return catalogue ?? { items: [], total: 0, itemsPerPage: 0, page: 0 };
  }

  @Get(':sourceId/catalogue/episodes')
  @PaginatedApiOkResponse(IndexItemDto)
  async getEpisodeCatalogue(
    @GetAuthUser() user: User,
    @Param('sourceId') sourceId: string,
    @GetAuthToken() token: string,
    @GetPaginationParams() pagination: PaginationParamsDto,
  ): Promise<PaginatedResponseDto<IndexItemDto>> {
    const connection = await this.getConnection(sourceId);

    const catalogue = await connection.provider.getEpisodeCatalogue?.(
      {
        userId: user.id,
        settings: connection.mediaSource.pluginSettings,
        token,
        sourceId: connection.mediaSource.id,
      },
      pagination,
    );

    return catalogue ?? { items: [], total: 0, itemsPerPage: 0, page: 0 };
  }

  @Get(':sourceId/movies/tmdb/:tmdbId/streams')
  @ApiOkResponse({
    description: 'Movie sources',
    type: StreamCandidatesDto,
  })
  async getMovieStreams(
    @Param('sourceId') sourceId: string,
    @Param('tmdbId') tmdbId: string,
    @GetAuthUser() user: User,
    @GetAuthToken() token: string,
  ): Promise<StreamCandidatesDto> {
    const connection = await this.getConnection(sourceId);
    const metadata = await this.getMovieMetadata(tmdbId);

    const streams = await connection.provider.getMovieStreams?.(
      tmdbId,
      metadata,
      {
        userId: user.id,
        settings: connection.mediaSource.pluginSettings,
        token,
        sourceId: connection.mediaSource.id,
      },
    );

    return streams ?? { candidates: [] };
  }

  @Get(':sourceId/shows/tmdb/:tmdbId/season/:season/episode/:episode/streams')
  @ApiOkResponse({
    description: 'Episode sources',
    type: StreamCandidatesDto,
  })
  async getEpisodeStreams(
    @Param('sourceId') sourceId: string,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
    @GetAuthUser() user: User,
    @GetAuthToken() token: string,
  ): Promise<StreamCandidatesDto> {
    const connection = await this.getConnection(sourceId);
    const metadata = await this.getSeriesMetadata(tmdbId, season, episode);

    const streams = await connection.provider.getEpisodeStreams?.(
      tmdbId,
      metadata,
      {
        userId: user.id,
        settings: connection.mediaSource.pluginSettings,
        token,
        sourceId: connection.mediaSource.id,
      },
    );

    return streams ?? { candidates: [] };
  }

  @Post(':sourceId/movies/tmdb/:tmdbId/streams/:key')
  @ApiOkResponse({
    description: 'Movie stream',
    type: StreamDto,
  })
  async getMovieStream(
    @Param('tmdbId') tmdbId: string,
    @Param('sourceId') sourceId: string,
    @Param('key') key: string,
    @GetAuthUser() user: User,
    @GetAuthToken() token: string,
    @Body() config: PlaybackConfigDto,
  ): Promise<StreamDto> {
    const connection = await this.getConnection(sourceId);
    const metadata = await this.getMovieMetadata(tmdbId);

    const stream = await connection.provider
      .getMovieStream?.(
        tmdbId,
        metadata,
        key || '',
        {
          userId: user.id,
          settings: connection.mediaSource.pluginSettings,
          token,
          sourceId: connection.mediaSource.id,
        },
        config,
      )
      .catch((e) => {
        if (e === SourceProviderError.StreamNotFound) {
          throw new NotFoundException('Stream not found');
        } else {
          console.error(e);
          throw new InternalServerErrorException();
        }
      });

    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

    return stream;
  }

  @Post(
    ':sourceId/shows/tmdb/:tmdbId/season/:season/episode/:episode/streams/:key',
  )
  @ApiOkResponse({
    description: 'Show stream',
    type: StreamDto,
  })
  async getEpisodeStream(
    @Param('sourceId') sourceId: string,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
    @Param('key') key: string,
    @GetAuthUser() user: User,
    @GetAuthToken() token: string,
    @Body() config: PlaybackConfigDto,
  ): Promise<StreamDto> {
    const connection = await this.getConnection(sourceId);
    const metadata = await this.getSeriesMetadata(tmdbId, season, episode);

    const stream = await connection.provider
      .getEpisodeStream?.(
        tmdbId,
        metadata,
        key || '',
        {
          userId: user.id,
          settings: connection.mediaSource.pluginSettings,
          token,
          sourceId: connection.mediaSource.id,
        },
        config,
      )
      .catch((e) => {
        if (e === SourceProviderError.StreamNotFound) {
          throw new NotFoundException('Stream not found');
        } else {
          console.error(e);
          throw new InternalServerErrorException();
        }
      });

    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

    return stream;
  }

  /** @deprecated */
  @All([':sourceId/proxy', ':sourceId/proxy/*'])
  async proxyHandler(
    @Param() params: any,
    @Query() query: any,
    @Req() req: Request,
    @Res() res: Response,
    @GetAuthUser() user: User,
    @GetAuthToken() token: string,
  ) {
    const sourceId = params.sourceId;
    const mediaSource =
      await this.mediaSourcesService.findMediaSource(sourceId);

    if (!mediaSource) throw new NotFoundException('Source not found');

    const provider = this.sourceProvidersService.getProvider(
      mediaSource.pluginId,
    );

    if (!provider) {
      throw new NotFoundException('Plugin not found');
    }

    if (!provider.proxyHandler) {
      throw new BadRequestException('Plugin does not support proxying');
    }

    const targetUrl = query.reiverr_proxy_url || undefined;

    await provider.proxyHandler?.(req, res, {
      context: {
        userId: user.id,
        token,
        sourceId,
        settings: mediaSource.pluginSettings,
      },
      uri: `/${params[0]}?${req.url.split('?').slice(1).join('?') || ''}`,
      targetUrl,
    });
  }

  async getMovieMetadata(tmdbId: string): Promise<MovieMetadata> {
    const metadata = await this.metadataService.getMovieByTmdbId(tmdbId);

    return {
      title: metadata.tmdbMovie?.title,
      ...(metadata.tmdbMovie.release_date && {
        year: new Date(metadata.tmdbMovie.release_date).getFullYear(),
      }),
      tmdbId,
    };
  }

  async getSeriesMetadata(
    tmdbId: string,
    season: number,
    episode: number,
  ): Promise<EpisodeMetadata> {
    const metadata = await this.metadataService.getSeriesByTmdbId(tmdbId);
    const name = metadata.tmdbSeries?.name;

    if (!name) throw new Error('Could not get metadata for series ' + tmdbId);

    return {
      series: name,
      tmdbId,
      season,
      episode,
      seasonEpisodes: metadata.tmdbSeries.seasons.find(
        (s) => s.season_number === season,
      )?.episode_count,
      episodeRuntime: metadata.tmdbSeries.last_episode_to_air.runtime,
    };
  }

  async getConnection(sourceId: string) {
    const mediaSource =
      await this.mediaSourcesService.findMediaSource(sourceId);

    if (!mediaSource.pluginId || !mediaSource.enabled) {
      throw new BadRequestException('Source not configured');
    }

    const provider = this.sourceProvidersService.getProvider(
      mediaSource.pluginId,
    );

    if (!provider) {
      throw new NotFoundException('Plugin not found');
    }

    return { provider, mediaSource };
  }
}
