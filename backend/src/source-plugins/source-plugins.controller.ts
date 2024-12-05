import {
  All,
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
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

  @Get(':sourceId/settings-template')
  async getSourceSettingsTemplate(
    @Param('sourceId') sourceId: string,
    @GetUser() callerUser: User,
  ) {
    const plugin = this.sourcesService.getPlugin(sourceId);

    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }

    // return plugin.getSettingsTemplate(callerUser.pluginSettings?.[sourceId]);
    return plugin.getSettingsTemplate();
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
