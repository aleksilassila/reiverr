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
import { SourcePlugin, SourcePluginError } from 'plugins/plugin-types';
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

@Controller()
@UseGuards(UserAccessControl)
export class SourcesController {
  constructor(
    private sourcesService: SourcePluginsService,
    private userSourcesService: UserSourcesService,
  ) {}

  @ApiTags('sources')
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

  @ApiTags('sources')
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

  @ApiTags('sources')
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

  @ApiTags('sources')
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

  @ApiTags('sources')
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

    return plugin.getMovieIndex(
      {
        settings,
        token,
      },
      pagination,
    );
  }

  @ApiTags('movies')
  @Get('movies/:tmdbId/sources/:sourceId/streams')
  @ApiOkResponse({
    description: 'Movie sources',
    type: VideoStreamListDto,
  })
  async getMovieStreams(
    @Param('tmdbId') tmdbId: string,
    @Param('sourceId') sourceId: string,
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

    const streams = await plugin.getMovieStreams(tmdbId, {
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

  @ApiTags('movies')
  @Post('movies/:tmdbId/sources/:sourceId/stream')
  @ApiOkResponse({
    description: 'Movie stream',
    type: VideoStreamDto,
  })
  async getMovieStream(
    @Param('tmdbId') tmdbId: string,
    @Param('sourceId') sourceId: string,
    @Query('key') key: string,
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

    return plugin
      .getMovieStream(
        tmdbId,
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

  @ApiTags('movies')
  @All('movies/:tmdbId/sources/:sourceId/stream/proxy/*')
  async getMovieStreamProxy(
    @Param() params: any,
    @Req() req: Request,
    @Res() res: Response,
    @GetAuthUser() user: User,
  ) {
    const sourceId = params.sourceId;
    const settings = this.userSourcesService.getSourceSettings(user, sourceId);

    if (!settings) throw new UnauthorizedException();

    const { url, headers } = this.sourcesService
      .getPlugin(sourceId)
      ?.handleProxy(
        {
          uri: params[0] + '?' + req.url.split('?')[1],
          headers: req.headers,
        },
        settings,
      );

    const proxyRes = await fetch(url, {
      method: req.method || 'GET',
      headers: {
        ...headers,
        // Authorization: `MediaBrowser DeviceId="${JELLYFIN_DEVICE_ID}", Token="${settings.apiKey}"`,
      },
    });

    Readable.from(proxyRes.body).pipe(res);
    res.status(proxyRes.status);
  }
}
