import {
  All,
  Controller,
  Get,
  Inject,
  Next,
  Param,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { GetAuthUser, UserAccessControl } from 'src/auth/auth.guard';
import { TMDB_CACHE_TTL, TMDB_API_KEY } from 'src/consts';
import { User } from 'src/users/user.entity';
import { Readable } from 'stream';
import { NextFunction, Request, Response } from 'express';
import { MetadataService } from '../metadata.service';
import {
  Cache,
  CACHE_MANAGER,
  CacheInterceptor,
  CacheTTL,
} from '@nestjs/cache-manager';

@UseGuards(UserAccessControl)
@Controller('tmdb')
export class TmdbController {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
  // constructor(private metadataService: MetadataService) {}

  // @Get('v3/proxy/3/movie/:tmdbId')
  // async getMovieDetails(
  //   @Param('tmdbId') tmdbId: string,
  //   @Next() next: NextFunction,
  //   @GetAuthUser() user: User,
  //   // @Res({ passthrough: true }) res: Response, // Passthrough required
  // ) {
  //   if (!parseInt(tmdbId)) {
  //     console.log('Invalid TMDB ID', tmdbId);
  //     next();
  //     return;
  //   }

  //   console.log('getting cached movie', tmdbId);

  //   const movie = await this.metadataService
  //     .getMovieByTmdbId(tmdbId)
  //     .catch((e) => {
  //       console.error('Error getting movie by TMDB ID', tmdbId, e);
  //       return null;
  //     });

  //   if (!movie?.tmdbMovie) {
  //     console.error('No movie found for TMDB ID', tmdbId);
  //   }
  //   console.log('returning cached movie', tmdbId);
  //   return movie?.tmdbMovie;
  // }

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
      console.error('Error getting cache', e);
      return null;
    });

    if (cached && req.method === 'GET') {
      console.log('returning cached response', uri);
      res.json(cached);
      return cached;
    }

    console.log('TMDB PROXY', req.url);

    // if (params[0].match(/^3\/movie\/\d+\/?$/)) {
    //   // console.log('req.params', req.params);

    //   const movie = await this.metadataService.getMovieByTmdbId(
    //     req.params[0].split('/')[2],
    //   );

    //   // console.log('movie', movie);
    //   if (movie?.tmdbMovie) {
    //     // console.log('returning cached movie');
    //     res.json(movie.tmdbMovie);
    //     return;
    //   }
    // }

    const proxyRes = await fetch(`https://api.themoviedb.org/${uri}`, {
      method: req.method || 'GET',
      headers: {
        Authorization: `Bearer ${TMDB_API_KEY}`,
        // ...headers,
        // Authorization: `MediaBrowser DeviceId="${JELLYFIN_DEVICE_ID}", Token="${settings.apiKey}"`,
      },
    })
      // .then((r) => {
      //   // r.text().then((text) =>
      //   //   console.log('TMDB Proxy response', uri, r.status, text),
      //   // );
      //   return r;
      // })
      .catch((e) => {
        console.error('TMDB Proxy error', e);
        // res.status(500).send('Proxy error');
        throw e;
      });

    // Readable.from(proxyRes.body).pipe(res);
    const json = await proxyRes.json();
    res.status(proxyRes.status);
    res.json(json);
    if (req.method === 'GET')
      await this.cacheManager.set(uri, json, TMDB_CACHE_TTL);
  }
}
