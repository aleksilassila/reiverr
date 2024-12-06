import {
  All,
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SourcePluginsService } from './source-plugins.service';
import { AuthGuard, GetUser } from 'src/auth/auth.guard';
import { Request, Response } from 'express';
import { Readable } from 'stream';
import { User } from 'src/users/user.entity';
import { UserSourcesService } from 'src/users/user-sources/user-sources.service';
import { PluginSettingsTemplate } from 'plugins/plugin-types';
import {
  PluginSettingsDto,
  PluginSettingsTemplateDto,
  ValidationResponsekDto,
} from './source-plugins.dto';

export const JELLYFIN_DEVICE_ID = 'Reiverr Client';

@ApiTags('sources')
@Controller('sources')
@UseGuards(AuthGuard)
export class SourcesController {
  constructor(
    private sourcesService: SourcePluginsService,
    private userSourcesService: UserSourcesService,
  ) {}

  @Get()
  @ApiOkResponse({
    description: 'All source plugins found',
    type: String,
    isArray: true,
  })
  async getSourcePlugins() {
    return this.sourcesService
      .getLoadedPlugins()
      .then((plugins) => Object.keys(plugins));
  }

  @Get(':sourceId/settings/template')
  @ApiOkResponse({
    description: 'Source settings template',
    type: PluginSettingsTemplateDto,
  })
  async getSourceSettingsTemplate(
    @Param('sourceId') sourceId: string,
    @GetUser() callerUser: User,
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

  @Post(':sourceId/settings/validate')
  @ApiOkResponse({
    description: 'Source settings validation',
    type: ValidationResponsekDto,
  })
  async validateSourceSettings(
    @GetUser() callerUser: User,
    @Param('sourceId') sourceId: string,
    @Body() settings: PluginSettingsDto,
  ): Promise<ValidationResponsekDto> {
    const plugin = this.sourcesService.getPlugin(sourceId);

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    return plugin.validateSettings(settings.settings);
  }

  @Get(':sourceId/movies/:tmdbId/stream')
  async getMovieStream(
    @Param('sourceId') sourceId: string,
    @Param('tmdbId') tmdbId: string,
    @GetUser() user: User,
  ) {
    if (!user) {
      throw new UnauthorizedException();
    }

    const settings = this.userSourcesService.getSourceSettings(user, sourceId);

    if (!settings) {
      throw new BadRequestException('Source configuration not found');
    }

    return this.sourcesService
      .getPlugin(sourceId)
      ?.getMovieStream(tmdbId, settings);
  }

  @All(':sourceId/movies/:tmdbId/stream/*')
  async getMovieStreamProxy(
    @Param() params: any,
    @Req() req: Request,
    @Res() res: Response,
    @GetUser() user: User,
  ) {
    const sourceId = params.sourceId;
    const settings = this.userSourcesService.getSourceSettings(user, sourceId);
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
        Authorization: `MediaBrowser DeviceId="${JELLYFIN_DEVICE_ID}", Token="${settings.apiKey}"`,
      },
    });

    Readable.from(proxyRes.body).pipe(res);
    res.status(proxyRes.status);
  }
}
