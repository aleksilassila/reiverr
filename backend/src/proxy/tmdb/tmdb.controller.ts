import { All, Controller, Inject, Query, Req, Res } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import axios from 'axios';
import { Request, Response } from 'express';
import { TMDB_API_KEY } from '../../consts';
import * as url from 'node:url';

@Controller('proxy/tmdb')
export class TmdbController {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  @All('*')
  async proxyRequest(
    @Req() req: Request,
    @Res() res: Response,
    @Query() queryParams,
  ) {
    // const externalApiUrl = 'https://external.api'; // Base URL of the external API
    // const url = `${externalApiUrl}${req.url}`;
    // const method = req.method;
    //
    // let data;
    // if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    //   data = req.body;
    // }
    //
    // const headers = { ...req.headers };
    // const uri = Reflect.getMetadata(
    //   PATH_METADATA,
    //   TmdbController.prototype.staticServe,
    // );
    const uri = url.parse(req.url).pathname.replace('/api/proxy/tmdb', '');

    const cacheValue = await this.cacheManager.get(uri);

    if (!cacheValue) {
      console.log('not cached', uri);

      const r = await axios(uri, {
        method: req.method,
        params: queryParams,
        // data: req.body,
        baseURL: 'https://api.themoviedb.org',
        // @ts-ignore
        headers: {
          // ...req.headers,
          Authorization: `Bearer ${TMDB_API_KEY}`,
        },
      })
        .then((r) => r.data)
        .catch((e) => {
          console.error(e);
          return 'err';
          // return 'err';
        });
      await this.cacheManager.set(uri, r);
      res.send(r);
    } else {
      res.send(cacheValue);
    }
  }
}
