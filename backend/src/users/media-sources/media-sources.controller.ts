import { SourceProviderError } from '@aleksilassila/reiverr-plugin';
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
import { MetadataService } from 'src/metadata/metadata.service';
import {
  PlaybackConfigDto,
  StreamCandidatesDto,
  StreamDto,
} from 'src/source-providers/source-provider.dto';
import { SourceProvidersService } from 'src/source-providers/source-providers.service';
import { User } from 'src/users/user.entity';
import { MediaSourcesService } from './media-sources.service';

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

  @Post(':sourceId/stream/:streamId')
  @ApiOkResponse({
    description: 'Movie stream',
    type: StreamDto,
  })
  async getStream(
    @Param('sourceId') sourceId: string,
    @Param('streamId') streamId: string,
    @GetAuthUser() user: User,
    @GetAuthToken() token: string,
    @Body() config: PlaybackConfigDto,
  ): Promise<StreamDto> {
    const connection = await this.getConnection({
      sourceId,
      userId: user.id,
      token,
    });

    const stream = await connection.provider
      .getStream?.({
        streamId,
        config,
      })
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
}
