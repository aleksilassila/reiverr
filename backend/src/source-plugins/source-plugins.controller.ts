import {
  All,
  BadRequestException,
  Body,
  Controller,
  Get,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
  PipeTransform,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import {
  MovieMetadata,
  SourcePlugin,
  SourcePluginError,
} from 'plugins/plugin-types';
import {
  UserAccessControl,
  GetAuthToken,
  GetAuthUser,
} from 'src/auth/auth.guard';
import {
  GetPaginationParams,
  PaginatedApiOkResponse,
} from 'src/common/common.decorator';
import {
  PaginatedResponseDto,
  PaginationParamsDto,
} from 'src/common/common.dto';
import { UserSourcesService } from 'src/users/user-sources/user-sources.service';
import { User } from 'src/users/user.entity';
import { Readable } from 'stream';
import {
  IndexItemDto,
  PlaybackConfigDto,
  PluginSettingsDto,
  PluginSettingsTemplateDto,
  SourcePluginCapabilitiesDto,
  ValidationResponseDto,
  VideoStreamDto,
  VideoStreamListDto,
} from './source-plugins.dto';
import { SourcePluginsService } from './source-plugins.service';
import { MetadataService } from 'src/metadata/metadata.service';

export const JELLYFIN_DEVICE_ID = 'Reiverr Client';

@Injectable()
export class ValidateSourcePluginPipe implements PipeTransform {
  constructor(private readonly sourcesService: SourcePluginsService) {}

  async transform(sourceId: string) {
    const plugin = this.sourcesService.getPlugin(sourceId);

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    return plugin;
  }
}

@ApiTags('sources')
@Controller()
@UseGuards(UserAccessControl)
export class SourcesController {
  constructor(
    private sourcesService: SourcePluginsService,
    private userSourcesService: UserSourcesService,
    private metadataService: MetadataService,
  ) {}

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

  async getSeriesMetadata(tmdbId: string) {
    const metadata = await this.metadataService.getSeriesByTmdbId(tmdbId);

    return {
      title: metadata.tmdbSeries?.name,
      tmdbId,
    };
  }

  @Get('sources')
  @ApiOkResponse({
    description: 'All source plugins found',
    type: String,
    isArray: true,
  })
  async getSourcePlugins() {
    return this.sourcesService
      .getPlugins()
      .then((plugins) => Object.keys(plugins));
  }

  @Get('sources/:sourceId/settings/template')
  @ApiOkResponse({
    description: 'Source settings template',
    type: PluginSettingsTemplateDto,
  })
  async getSourceSettingsTemplate(
    @Param('sourceId') sourceId: string,
    @GetAuthUser() callerUser: User,
  ): Promise<PluginSettingsTemplateDto> {
    const plugin = this.sourcesService.getPlugin(sourceId);

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    // return plugin.getSettingsTemplate(callerUser.pluginSettings?.[sourceId]);
    return {
      settings: plugin.getSettingsTemplate(),
    };
  }

  @Post('sources/:sourceId/settings/validate')
  @ApiOkResponse({
    description: 'Source settings validation',
    type: ValidationResponseDto,
  })
  async validateSourceSettings(
    @GetAuthUser() callerUser: User,
    @Param('sourceId') sourceId: string,
    @Body() settings: PluginSettingsDto,
  ): Promise<ValidationResponseDto> {
    const plugin = this.sourcesService.getPlugin(sourceId);

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    return plugin.validateSettings(settings.settings);
  }

  @Get('sources/:sourceId/capabilities')
  @ApiOkResponse({
    type: SourcePluginCapabilitiesDto,
  })
  async getSourceCapabilities(
    @GetAuthUser() user: User,
    @Param('sourceId', ValidateSourcePluginPipe) plugin: SourcePlugin,
    @GetAuthToken() token: string,
  ): Promise<SourcePluginCapabilitiesDto> {
    const settings = this.userSourcesService.getSourceSettings(
      user,
      plugin.name,
    );

    if (!settings) {
      throw new BadRequestException('Source configuration not found');
    }

    return plugin.getCapabilities({
      settings: settings.settings,
      token,
    });
  }

  @Get('sources/:sourceId/index/movies')
  @PaginatedApiOkResponse(IndexItemDto)
  async getSourceMovieIndex(
    @GetAuthUser() user: User,
    @Param('sourceId', ValidateSourcePluginPipe) plugin: SourcePlugin,
    @GetAuthToken() token: string,
    @GetPaginationParams() pagination: PaginationParamsDto,
  ): Promise<PaginatedResponseDto<IndexItemDto>> {
    const settings = this.userSourcesService.getSourceSettings(
      user,
      plugin.name,
    );

    if (!settings) {
      throw new BadRequestException('Source configuration not found');
    }

    if (!plugin.getMovieIndex) {
      throw new BadRequestException('Plugin does not support indexing');
    }

    return plugin.getMovieIndex(
      {
        settings,
        token,
      },
      pagination,
    );
  }

  @Get('sources/:sourceId/movies/tmdb/:tmdbId/streams')
  @ApiOkResponse({
    description: 'Movie sources',
    type: VideoStreamListDto,
  })
  async getMovieStreams(
    @Param('sourceId') sourceId: string,
    @Param('tmdbId') tmdbId: string,
    @GetAuthUser() user: User,
    @GetAuthToken() token: string,
  ): Promise<VideoStreamListDto> {
    const plugin = this.sourcesService.getPlugin(sourceId);

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    const settings = this.userSourcesService.getSourceSettings(user, sourceId);

    if (!settings) {
      throw new BadRequestException('Source configuration not found');
    }

    const metadata = await this.getMovieMetadata(tmdbId);

    const streams = await plugin.getMovieStreams(tmdbId, metadata, {
      settings,
      token,
    });

    return {
      streams,
    };

    // const plugins = await this.sourcesService.getPlugins();
    // const streams: VideoStreamListDto['streams'] = [];

    // for (const pluginId in plugins) {
    //   const plugin = plugins[pluginId];

    //   if (!plugin) continue;

    //   const settings = this.userSourcesService.getSourceSettings(
    //     user,
    //     pluginId,
    //   );

    //   if (!settings) continue;

    //   const videoStream = await plugin.getMovieStreams(tmdbId, {
    //     settings,
    //     token,
    //   });

    //   if (!videoStream) continue;

    //   streams[pluginId] = videoStream;
    // }

    // return {
    //   streams,
    // };
  }

  @Get(
    'sources/:sourceId/shows/tmdb/:tmdbId/season/:season/episode/:episode/streams',
  )
  @ApiOkResponse({
    description: 'Episode sources',
    type: VideoStreamListDto,
  })
  async getEpisodeStreams(
    @Param('sourceId') sourceId: string,
    @Param('tmdbId') tmdbId: string,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
    @GetAuthUser() user: User,
    @GetAuthToken() token: string,
  ): Promise<VideoStreamListDto> {
    const plugin = this.sourcesService.getPlugin(sourceId);

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    const settings = this.userSourcesService.getSourceSettings(user, sourceId);

    if (!settings) {
      throw new BadRequestException('Source configuration not found');
    }

    const metadata = await this.getSeriesMetadata(tmdbId);

    if (!metadata.title) {
      throw new NotFoundException('Show not found');
    }

    const streams = await plugin.getEpisodeStreams(
      tmdbId,
      metadata.title,
      season,
      episode,
      {
        settings,
        token,
      },
    );

    return {
      streams,
    };
  }

  @Post('sources/:sourceId/movies/tmdb/:tmdbId/streams/:key')
  @ApiOkResponse({
    description: 'Movie stream',
    type: VideoStreamDto,
  })
  async getMovieStream(
    @Param('tmdbId') tmdbId: string,
    @Param('sourceId') sourceId: string,
    // @Query('key') key: string,
    @Param('key') key: string,
    @GetAuthUser() user: User,
    @GetAuthToken() token: string,
    @Body() config: PlaybackConfigDto,
  ): Promise<VideoStreamDto> {
    const plugin = this.sourcesService.getPlugin(sourceId);

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    const settings = this.userSourcesService.getSourceSettings(user, sourceId);

    if (!settings) {
      throw new BadRequestException('Source configuration not found');
    }

    const metadata = await this.getMovieMetadata(tmdbId);

    return plugin
      .getMovieStream(
        tmdbId,
        metadata,
        key || '',
        {
          settings,
          token,
        },
        config,
      )
      .catch((e) => {
        if (e === SourcePluginError.StreamNotFound) {
          throw new NotFoundException('Stream not found');
        } else {
          console.error(e);
          throw new InternalServerErrorException();
        }
      });
  }

  @Post(
    'sources/:sourceId/shows/tmdb/:tmdbId/season/:season/episode/:episode/streams/:key',
  )
  @ApiOkResponse({
    description: 'Show stream',
    type: VideoStreamDto,
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
  ): Promise<VideoStreamDto> {
    const plugin = this.sourcesService.getPlugin(sourceId);

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    const settings = this.userSourcesService.getSourceSettings(user, sourceId);

    if (!settings) {
      throw new BadRequestException('Source configuration not found');
    }

    const metadata = await this.getSeriesMetadata(tmdbId);

    if (!metadata.title) {
      throw new NotFoundException('Show not found');
    }

    return plugin
      .getEpisodeStream(
        tmdbId,
        metadata.title || '',
        season,
        episode,
        key || '',
        {
          settings,
          token,
        },
        config,
      )
      .catch((e) => {
        if (e === SourcePluginError.StreamNotFound) {
          throw new NotFoundException('Stream not found');
        } else {
          console.error(e);
          throw new InternalServerErrorException();
        }
      });
  }

  /** @deprecated */
  @All(['sources/:sourceId/proxy', 'sources/:sourceId/proxy/*'])
  async movieStreamProxy(
    @Param() params: any,
    @Query() query: any,
    @Req() req: Request,
    @Res() res: Response,
    @GetAuthUser() user: User,
    @GetAuthToken() token: string,
  ) {
    const sourceId = params.sourceId;
    const settings = this.userSourcesService.getSourceSettings(user, sourceId);

    if (!settings) throw new UnauthorizedException();

    const plugin = this.sourcesService.getPlugin(sourceId);

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    if (!plugin.proxyHandler) {
      throw new BadRequestException('Plugin does not support proxying');
    }

    const targetUrl = query.reiverr_proxy_url || undefined;

    await plugin.proxyHandler?.(req, res, {
      context: { settings, token },
      uri: `/${params[0]}?${req.url.split('?').slice(1).join('?') || ''}`,
      targetUrl,
    });
  }

  //   @All('movies/:tmdbId/sources/:sourceId/stream/proxy/*')
  //   async getMovieStreamProxy(
  //     @Param() params: any,
  //     @Req() req: Request,
  //     @Res() res: Response,
  //     @GetAuthUser() user: User,
  //   ) {
  //     const sourceId = params.sourceId;
  //     const settings = this.userSourcesService.getSourceSettings(user, sourceId);

  //     if (!settings) throw new UnauthorizedException();

  //     const { url, headers } = this.sourcesService
  //       .getPlugin(sourceId)
  //       ?.handleProxy(
  //         {
  //           uri: params[0] + '?' + req.url.split('?')[1],
  //           headers: req.headers,
  //         },
  //         settings,
  //       );

  //     // console.log('url', url.split('?')[0]);
  //     const proxyRes = await fetch(url.split('?')[0], {
  //       method: req.method || 'GET',
  //       headers: {
  //         // ...headers,
  //         // Authorization: `MediaBrowser DeviceId="${JELLYFIN_DEVICE_ID}", Token="${settings.apiKey}"`,
  //       },
  //     }).catch((e) => {
  //       console.error('error fetching proxy response', e);
  //       throw new InternalServerErrorException();
  //     });

  //     Readable.from(proxyRes.body).pipe(res);
  //     res.status(proxyRes.status);
  //   }
}
