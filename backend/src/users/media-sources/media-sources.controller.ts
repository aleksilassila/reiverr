import { SourceProviderError } from '@aleksilassila/reiverr-shared/dist/src/old';
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
import { ApiBody, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  GetAuthToken,
  GetAuthUser,
  UserAccessControl,
} from 'src/auth/auth.guard';
import { MetadataService } from 'src/metadata/metadata.service';
import {
  ActionResponseDto,
  MediaSourceActionBodyDto,
  StreamActionResponseDto,
  StreamCandidatesDto,
} from 'src/source-providers/source-provider.dto';
import { SourceProvidersService } from 'src/source-providers/source-providers.service';
import { User } from 'src/users/user.entity';
import { AutoplayResponseDto } from './media-source-responses.dto';
import {
  MediaSourceViewResponseDto,
  ProviderWithStreamsDto,
  ViewProvidersResponseDto as ViewGroupsResponseDto,
  ViewProviderDto,
} from './media-source.dto';
import { MediaSourcesService } from './media-sources.service';
import { PaginatedResponseDto } from 'src/common/common.dto';
import { PaginatedApiOkResponse } from 'src/common/common.decorator';

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

  @Get('candidates')
  // @ApiOkResponse({
  //   description: 'TMDB episode media candidates',
  //   type: ,
  // })
  @PaginatedApiOkResponse(ProviderWithStreamsDto)
  @ApiQuery({ name: 'tmdbId', type: 'string' })
  @ApiQuery({ name: 'season', type: 'number', required: false })
  @ApiQuery({ name: 'episode', type: 'number', required: false })
  async getTmdbEpisodeMedia(
    @Query('tmdbId') tmdbId: string,
    @Query('season') season: number,
    @Query('episode') episode: number,
    @GetAuthUser() user: User,
    @GetAuthToken() token: string,
  ): Promise<PaginatedResponseDto<ProviderWithStreamsDto>> {
    const context = this.getPlayablePluginContext(tmdbId, season, episode);

    const tmdbSeriesP = this.metadataService.getSeriesByTmdbId(tmdbId);
    const tmdbEpisodeP = this.metadataService.getEpisodeByTmdbId({
      tmdbId,
      season,
      episode,
    });

    const providers = await Promise.all(
      user.mediaSources.map(async (ms) => {
        const mediaSourceDto =
          await this.mediaSourcesService.getMediaSourceDto(ms);

        const connection = await this.getConnection({
          sourceId: ms.id,
          userId: user.id,
          token,
        });
        const tmdbSeries = await tmdbSeriesP;
        const tmdbEpisode = await tmdbEpisodeP;

        const { candidates: streams } =
          await connection.provider.getTmdbEpisodeCandidates?.({
            tmdbSeries: tmdbSeries.tmdbSeries,
            tmdbEpisode: tmdbEpisode.tmdbEpisode,
          });

        return {
          provider: mediaSourceDto,
          context,
          streams,
        };
      }),
    );

    return {
      items: providers,
      itemsPerPage: 0,
      page: 0,
      total: 0,
    };
  }

  @Get('views')
  @ApiOkResponse({
    description: 'Movie views',
    type: ViewGroupsResponseDto,
  })
  @ApiQuery({ name: 'tmdbId', type: 'string' })
  @ApiQuery({ name: 'season', type: 'number', required: false })
  @ApiQuery({ name: 'episode', type: 'number', required: false })
  async getMediaSourceViewGroups(
    @Query('tmdbId') tmdbId: string,
    @GetAuthUser() user: User,
    @GetAuthToken() token: string,
    @Query('season', new ParseIntPipe({ optional: true })) season?: number,
    @Query('episode', new ParseIntPipe({ optional: true })) episode?: number,
  ): Promise<ViewGroupsResponseDto> {
    const context = this.getPlayablePluginContext(tmdbId, season, episode);

    const viewGroups: Record<string, ViewProviderDto[]> = {};

    const ps = user.mediaSources.map(async (ms) => {
      const connection = await this.getConnection({
        sourceId: ms.id,
        userId: user.id,
        token,
      });

      const { views } = await connection.provider.getMeidaSourceViews({
        ...(await context),
      });

      views.forEach((view) => {
        if (!viewGroups[view.label]) {
          viewGroups[view.label] = [];
        }
        viewGroups[view.label].push({
          view,
          sourceId: ms.id,
        });
      });
    });

    await Promise.all(ps);

    return {
      viewGroups: Object.entries(viewGroups).map(([label, viewProviders]) => ({
        label,
        viewProviders,
      })),
    };
  }

  @Get(':sourceId/views/:viewId')
  @ApiOkResponse({
    description: 'Movie view',
    type: MediaSourceViewResponseDto,
  })
  @ApiQuery({ name: 'tmdbId', type: 'string' })
  @ApiQuery({ name: 'season', type: 'number', required: false })
  @ApiQuery({ name: 'episode', type: 'number', required: false })
  async getView(
    @Param('sourceId') sourceId: string,
    @Param('viewId') id: string,
    @Query('tmdbId') tmdbId: string,
    @GetAuthUser() user: User,
    @GetAuthToken() token: string,
    @Query('season', new ParseIntPipe({ optional: true })) season?: number,
    @Query('episode', new ParseIntPipe({ optional: true })) episode?: number,
  ): Promise<MediaSourceViewResponseDto> {
    if (!tmdbId) throw new BadRequestException('tmdbId is required');

    const context = this.getPlayablePluginContext(tmdbId, season, episode);

    const connection = await this.getConnection({
      sourceId,
      userId: user.id,
      token,
    });

    const { view } = await connection.provider.getMediaSourceView({
      id,
      ...(await context),
    });

    return {
      view,
      // generalView: view.type === 'general' ? view : undefined,
      // listWithDetailsView: view.type === 'list-with-details' ? view : undefined,
    };
  }

  /** @deprecated */
  @Get(':sourceId/candidates/tmdb/:tmdbId')
  @ApiOkResponse({
    description: 'Movie sources',
    type: StreamCandidatesDto,
  })
  async getTmdbMovieCandidates(
    @Param('sourceId') sourceId: string,
    @Param('tmdbId') tmdbId: string,
    @GetAuthUser() user: User,
    @GetAuthToken() token: string,
  ): Promise<StreamCandidatesDto> {
    const connection = await this.getConnection({
      sourceId,
      userId: user.id,
      token,
    });
    const tmdbMovie = this.metadataService.getMovieByTmdbId(tmdbId);

    const streams = await connection.provider.getTmdbMovieCandidates?.({
      tmdbMovie: await tmdbMovie.then((m) => m.tmdbMovie),
    });

    return streams ?? { candidates: [] };
  }

  /** @deprecated */
  @Get(':sourceId/candidates/tmdb/:tmdbId/season/:season/episode/:episode')
  @ApiOkResponse({
    description: 'Episode sources',
    type: StreamCandidatesDto,
  })
  async getTmdbEpisodeCandidates(
    @Param('sourceId') sourceId: string,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
    @GetAuthUser() user: User,
    @GetAuthToken() token: string,
  ): Promise<StreamCandidatesDto> {
    const connection = await this.getConnection({
      sourceId,
      userId: user.id,
      token,
    });
    const tmdbSeries = this.metadataService.getSeriesByTmdbId(tmdbId);
    const tmdbEpisode = this.metadataService.getEpisodeByTmdbId({
      tmdbId,
      season,
      episode,
    });

    const streams = await connection.provider.getTmdbEpisodeCandidates?.({
      tmdbSeries: await tmdbSeries.then((s) => s.tmdbSeries),
      tmdbEpisode: await tmdbEpisode.then((e) => e.tmdbEpisode),
    });

    return streams ?? { candidates: [] };
  }

  @Post(':sourceId/autoplay-stream')
  @ApiOkResponse({
    description: 'Movie stream',
    type: AutoplayResponseDto,
  })
  @ApiQuery({ name: 'tmdbId', type: 'string' })
  @ApiQuery({ name: 'season', type: 'number', required: false })
  @ApiQuery({ name: 'episode', type: 'number', required: false })
  async getAutoplayStream(
    @Param('sourceId') sourceId: string,
    @GetAuthUser() user: User,
    @GetAuthToken() token: string,
    @Query('tmdbId') tmdbId: string,
    @Query('season', new ParseIntPipe({ optional: true })) season?: number,
    @Query('episode', new ParseIntPipe({ optional: true })) episode?: number,
  ): Promise<AutoplayResponseDto> {
    if (!tmdbId) throw new BadRequestException('tmdbId is required');

    const context = this.getPlayablePluginContext(tmdbId, season, episode);

    const connection = await this.getConnection({
      sourceId,
      userId: user.id,
      token,
    });

    const { candidate } = await connection.provider.getAutoplayStream({
      ...(await context),
    });

    return {
      candidate,
    };
  }

  @Post(':sourceId/stream/:streamId')
  @ApiOkResponse({
    description: 'Movie stream',
    type: StreamActionResponseDto,
  })
  @ApiBody({ required: false, type: MediaSourceActionBodyDto })
  async getStream(
    @Param('sourceId') sourceId: string,
    @Param('streamId') streamId: string,
    @GetAuthUser() user: User,
    @GetAuthToken() token: string,
    @Body() config: MediaSourceActionBodyDto = {},
  ): Promise<StreamActionResponseDto> {
    const { playbackConfig } = config;

    const connection = await this.getConnection({
      sourceId,
      userId: user.id,
      token,
    });

    const response = await connection.provider
      .getStream({
        streamId,
        config: playbackConfig,
      })
      .catch((e) => {
        if (e === SourceProviderError.StreamNotFound) {
          throw new NotFoundException('Stream not found');
        } else {
          console.error(e);
          throw new InternalServerErrorException();
        }
      });

    // if (!response) {
    //   throw new InternalServerErrorException('No response from provider');
    // }

    return response;
  }

  @Post(':sourceId/action/:action/:targetId')
  @ApiOkResponse({
    description: 'Movie stream',
    type: ActionResponseDto,
  })
  // @ApiBody({ required: false, type: MediaSourceActionBodyDto })
  async handleViewAction(
    @Param('sourceId') sourceId: string,
    @Param('targetId') targetId: string,
    @Param('action') action: string,
    @GetAuthUser() user: User,
    @GetAuthToken() token: string,
    // @Body() config: MediaSourceActionBodyDto = {},
  ): Promise<ActionResponseDto> {
    // const { playbackConfig } = config;

    const connection = await this.getConnection({
      sourceId,
      userId: user.id,
      token,
    });

    const response = await connection.provider
      .handleAction({
        targetId,
        action,
      })
      .catch((e) => {
        if (e === SourceProviderError.StreamNotFound) {
          throw new NotFoundException('Stream not found');
        } else {
          console.error(e);
          throw new InternalServerErrorException();
        }
      });

    // if (!response) {
    //   throw new InternalServerErrorException('No response from provider');
    // }

    return response;
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

    const provider = this.sourceProvidersService
      .getPlugin(mediaSource.pluginId)
      .getMediaSourceProvider({
        settings: mediaSource.pluginSettings,
        sourceId,
        token,
        userId: user.id,
      });

    if (!provider) {
      throw new NotFoundException('Plugin not found');
    }

    if (!provider.proxyHandler) {
      throw new BadRequestException('Plugin does not support proxying');
    }

    const targetUrl = query.reiverr_proxy_url || undefined;

    await provider.proxyHandler?.({
      req,
      res,
      uri: `/${params[0]}?${req.url.split('?').slice(1).join('?') || ''}`,
      targetUrl,
    });
  }

  async getConnection(
    ...args: Parameters<MediaSourcesService['getConnection']>
  ) {
    const connection = await this.mediaSourcesService.getConnection(...args);

    if (!connection) {
      throw new BadRequestException('Invalid source');
    }

    return connection;
  }

  async getPlayablePluginContext(
    tmdbId: string,
    season?: number,
    episode?: number,
  ) {
    const tmdbMovie =
      season === undefined && episode === undefined
        ? this.metadataService.getMovieByTmdbId(tmdbId).then((m) => m.tmdbMovie)
        : undefined;
    const tmdbSeries =
      season !== undefined && episode !== undefined
        ? this.metadataService
            .getSeriesByTmdbId(tmdbId)
            .then((s) => s.tmdbSeries)
        : undefined;
    const tmdbEpisode =
      season !== undefined && episode !== undefined
        ? this.metadataService
            .getEpisodeByTmdbId({ tmdbId, season, episode })
            .then((e) => e.tmdbEpisode)
        : undefined;

    return {
      tmdbMovie: await tmdbMovie,
      tmdbSeries: await tmdbSeries,
      tmdbEpisode: await tmdbEpisode,
    };
  }
}
