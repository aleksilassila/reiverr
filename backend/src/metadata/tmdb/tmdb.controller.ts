import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  All,
  Controller,
  Inject,
  Logger,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { GetAuthUser, UserAccessControl } from 'src/auth/auth.guard';
import { TMDB_API_KEY, TMDB_CACHE_TTL } from 'src/consts';
import { User } from 'src/users/user.entity';
import { MetadataService } from '../metadata.service';

@UseGuards(UserAccessControl)
@Controller('tmdb')
export class TmdbController {
  private logger = new Logger(TmdbController.name);
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private metadataService: MetadataService,
  ) {}

  // @UseInterceptors(CacheInterceptor)
  // @CacheTTL(METADATA_CACHE_TTL)
  @All('v3/proxy/*')
  async tmdbProxy(
    @Param() params: any,
    @Req() req: Request,
    @Res() res: Response,
    @GetAuthUser() user: User,
  ) {
    const uri = params[0] + '?' + req.url.split('?')[1];
    const cached = await this.cacheManager.get(uri).catch((e) => {
      this.logger.error('Error getting cache', e);
      return null;
    });

    if (cached && req.method === 'GET') {
      // console.log('returning cached response', uri);
      res.json(cached);
      return cached;
    }

    // 3/tv/87739?append_to_response=videos%2Caggregate_credits%2Cexternal_ids%2Cimages&include_image_language=en%2Cen%2Cnull
    const first = uri.split('?')?.[0];
    if (req.method === 'GET' && first.match(/3\/tv\/\d+$/)) {
      const tmdbId = first.split('/').pop();
      this.logger.debug(`Getting series from cache: ${tmdbId}`);
      const metadata = await this.metadataService.getSeriesByTmdbId(tmdbId);
      res.json(metadata.tmdbSeries);
      return metadata;
    } else if (req.method === 'GET' && first.match(/3\/movie\/\d+$/)) {
      const tmdbId = first.split('/').pop();
      this.logger.debug(`Getting movie from cache: ${tmdbId}`);
      const metadata = await this.metadataService.getMovieByTmdbId(tmdbId);
      res.json(metadata.tmdbMovie);
      return metadata;
    }

    this.logger.debug(`TMDB proxy cache miss: ${req.method} ${uri}`);

    const proxyRes = await fetch(`https://api.themoviedb.org/${uri}`, {
      method: req.method || 'GET',
      headers: {
        Authorization: `Bearer ${TMDB_API_KEY}`,
      },
    }).catch((e) => {
      this.logger.error('TMDB Proxy error', e);
      throw e;
    });

    const json = await proxyRes.json();
    res.status(proxyRes.status);
    res.json(json);
    if (req.method === 'GET')
      await this.cacheManager.set(uri, json, TMDB_CACHE_TTL);
  }
}
