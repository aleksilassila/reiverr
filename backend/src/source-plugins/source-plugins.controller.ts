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
  EpisodeMetadata,
  MovieMetadata,
  SourceProvider,
  SourceProviderError,
} from 'plugin-types';
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
import { UserSourcesService } from 'src/users/user-sources/user-sources.service';
import { User } from 'src/users/user.entity';
import {
  IndexItemDto,
  PlaybackConfigDto,
  PluginSettingsDto,
  PluginSettingsTemplateDto,
  SourceProviderCapabilitiesDto,
  StreamCandidatesDto,
  StreamDto,
  ValidationResponseDto,
} from './source-plugins.dto';
import { SourcePluginsService } from './source-plugins.service';

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
      settings: plugin.settingsManager.getSettingsTemplate(),
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

    return plugin.settingsManager.validateSettings(settings.settings);
  }

  @Get('sources/:sourceId/capabilities')
  @ApiOkResponse({
    type: SourceProviderCapabilitiesDto,
  })
  async getSourceCapabilities(
    @GetAuthUser() user: User,
    @Param('sourceId', ValidateSourcePluginPipe) plugin: SourceProvider,
    @GetAuthToken() token: string,
  ): Promise<SourceProviderCapabilitiesDto> {
    const settings = this.userSourcesService.getSourceSettings(
      user,
      plugin.name,
    );

    if (!settings) {
      throw new BadRequestException('Source configuration not found');
    }

    return {
      movieIndexing: !!plugin.getMovieCatalogue,
      episodeIndexing: !!plugin.getEpisodeCatalogue,
      moviePlayback: !!plugin.getMovieStreams && !!plugin.getMovieStream,
      episodePlayback: !!plugin.getEpisodeStreams && !!plugin.getEpisodeStream,
    };
  }

  @Get('sources/:sourceId/catalogue/movies')
  @PaginatedApiOkResponse(IndexItemDto)
  async getMovieCatalogue(
    @GetAuthUser() user: User,
    @Param('sourceId', ValidateSourcePluginPipe) plugin: SourceProvider,
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

    if (!plugin.getMovieCatalogue) {
      throw new BadRequestException('Plugin does not support indexing');
    }

    const catalogue = await plugin.getMovieCatalogue?.(
      {
        settings,
        token,
      },
      pagination,
    );

    return catalogue ?? { items: [], total: 0, itemsPerPage: 0, page: 0 };
  }

  @Get('sources/:sourceId/catalogue/episodes')
  @PaginatedApiOkResponse(IndexItemDto)
  async getEpisodeCatalogue(
    @GetAuthUser() user: User,
    @Param('sourceId', ValidateSourcePluginPipe) plugin: SourceProvider,
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

    if (!plugin.getEpisodeCatalogue) {
      throw new BadRequestException('Plugin does not support indexing');
    }

    const catalogue = await plugin.getEpisodeCatalogue?.(
      {
        settings,
        token,
      },
      pagination,
    );

    return catalogue ?? { items: [], total: 0, itemsPerPage: 0, page: 0 };
  }

  @Get('sources/:sourceId/movies/tmdb/:tmdbId/streams')
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
    const plugin = this.sourcesService.getPlugin(sourceId);

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    const settings = this.userSourcesService.getSourceSettings(user, sourceId);

    if (!settings) {
      throw new BadRequestException('Source configuration not found');
    }

    const metadata = await this.getMovieMetadata(tmdbId);

    const streams = await plugin.getMovieStreams?.(tmdbId, metadata, {
      settings,
      token,
    });

    return streams ?? { candidates: [] };
  }

  @Get(
    'sources/:sourceId/shows/tmdb/:tmdbId/season/:season/episode/:episode/streams',
  )
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
    const plugin = this.sourcesService.getPlugin(sourceId);

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    const settings = this.userSourcesService.getSourceSettings(user, sourceId);

    if (!settings) {
      throw new BadRequestException('Source configuration not found');
    }

    const metadata = await this.getSeriesMetadata(tmdbId, season, episode);

    const streams = await plugin.getEpisodeStreams?.(tmdbId, metadata, {
      settings,
      token,
    });

    return streams ?? { candidates: [] };
  }

  @Post('sources/:sourceId/movies/tmdb/:tmdbId/streams/:key')
  @ApiOkResponse({
    description: 'Movie stream',
    type: StreamDto,
  })
  async getMovieStream(
    @Param('tmdbId') tmdbId: string,
    @Param('sourceId') sourceId: string,
    // @Query('key') key: string,
    @Param('key') key: string,
    @GetAuthUser() user: User,
    @GetAuthToken() token: string,
    @Body() config: PlaybackConfigDto,
  ): Promise<StreamDto> {
    const plugin = this.sourcesService.getPlugin(sourceId);

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    const settings = this.userSourcesService.getSourceSettings(user, sourceId);

    if (!settings) {
      throw new BadRequestException('Source configuration not found');
    }

    const metadata = await this.getMovieMetadata(tmdbId);

    const stream = await plugin
      .getMovieStream?.(
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
    'sources/:sourceId/shows/tmdb/:tmdbId/season/:season/episode/:episode/streams/:key',
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
    const plugin = this.sourcesService.getPlugin(sourceId);

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    const settings = this.userSourcesService.getSourceSettings(user, sourceId);

    if (!settings) {
      throw new BadRequestException('Source configuration not found');
    }

    const metadata = await this.getSeriesMetadata(tmdbId, season, episode);

    const stream = await plugin
      .getEpisodeStream?.(
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
  @All(['sources/:sourceId/proxy', 'sources/:sourceId/proxy/*'])
  async proxyHandler(
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
}
