import {
  All,
  Controller,
  Get,
  Next,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SourcePluginsService } from './source-plugins.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { NextFunction, Request, Response } from 'express';
import { Readable } from 'stream';

const config = {
  apiKey: '',
  baseUrl: 'http://192.168.0.129:8096',
  userId: '',
};
export const JELLYFIN_DEVICE_ID = 'Reiverr Client';

@ApiTags('sources')
@Controller('sources')
@UseGuards(AuthGuard)
export class SourcesController {
  constructor(private sourcesService: SourcePluginsService) {}

  @Get()
  async getSources() {
    this.sourcesService.getLoadedPlugins();
  }

  @Get(':sourceId/movies/:tmdbId/stream')
  async getMovieStream(
    @Param('sourceId') sourceId: string,
    @Param('tmdbId') tmdbId: string,
  ) {
    return this.sourcesService.getPlugin(sourceId)?.getMovieStream(tmdbId);
  }

  @All(':sourceId/movies/:tmdbId/stream/*')
  async getMovieStreamProxy(
    @Param() params: any,
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    const { url, headers } = this.sourcesService
      .getPlugin(params.sourceId)
      ?.handleProxy({
        uri: params[0] + '?' + req.url.split('?')[1],
        headers: req.headers,
      });

    const proxyRes = await fetch(url, {
      method: req.method || 'GET',
      headers: {
        ...headers,
        Authorization: `MediaBrowser DeviceId="${JELLYFIN_DEVICE_ID}", Token="${config.apiKey}"`,
      },
    });

    Readable.from(proxyRes.body).pipe(res);
    res.status(proxyRes.status);
  }
}
