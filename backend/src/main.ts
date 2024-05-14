import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as proxy from 'express-http-proxy';
import { NextFunction, Request, Response } from 'express';
import { CsnService } from './csn/csn.service';
import { AuthGuard } from './auth/auth.guard';
import { User } from './user/user.entity';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();

  // app.use((req, res, next) => {
  //   console.log('Request', req.url);
  //   next();
  // });

  app.use(
    '/api/peer/:peerId/proxy/jellyfin',
    (req: Request, res: Response, next: NextFunction) => {
      const id = req.params.peerId;
      const csnService = app.get(CsnService);
      const connectedPeers = Array.from(csnService.connections.values()).map(
        (c) => c.peer,
      );

      const peer = connectedPeers.find((peer) => peer.id === id);

      if (peer) {
        proxy(`http://${peer.host}:9494`, {
          proxyReqPathResolver: (req) => '/api/proxy/jellyfin' + req.url,
        })(req, res, next);
      } else {
        console.error('Could not find peer to proxy to', id);
        return;
      }
    },
  );

  app.use(
    '/api/peers/proxy/jellyfin',
    (req: Request, res: Response, next: NextFunction) => {
      const authGuard = app.get(AuthGuard);
      const csnService = app.get(CsnService);

      // if (!authGuard.canActivateWithRequest(req) || !req['user']) {
      //   return;
      // }
      //
      // const user = req['user'] as User;
      const user = { id: undefined };

      const peers = Array.from(csnService.connections.values())
        .map((c) => c.peer)
        .filter(
          (peer) =>
            peer.instance?.user?.id === user.id || !peer.instance?.user?.id,
        );

      const requests = peers.map((peer) =>
        proxyRequest(
          req,
          (uri) => `http://${peer.host}:9494/api/proxy/jellyfin${uri}`,
        ).then(async (response) => {
          const isJson = response.headers
            .get('content-type')
            ?.includes('application/json');

          const data = isJson ? await response.json() : await response.text();

          return { peer, data };
        }),
      );

      Promise.all(requests)
        .then((data) => res.json(data))
        .catch((e) => {
          console.error('Error proxying to peers', e);
          res.status(500).send(e);
        });
    },
  );

  app.use(
    '/api/proxy/jellyfin',
    async (req: Request, res: Response, next: NextFunction) => {
      // console.log('Proxying for jellyfin', req.url, req);
      proxy('http://192.168.0.129:8096')(req, res, next);
      //   const r = await proxyRequest(req, (u) => {
      //     return 'http://192.168.0.129:8096' + u;
      //   });
      //
      //   console.log('Result from proxy', r);
      //   res.send(r);
      //   // console.log('Result from proxy', r, res);
    },
  );

  const config = new DocumentBuilder().build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });
  SwaggerModule.setup('openapi', app, document);
  fs.writeFileSync('./swagger-spec.json', JSON.stringify(document));

  // app.connectMicroservice({
  //   transport: Transport.TCP,
  //   config: {
  //     host: '0.0.0.0',
  //     port: 9495,
  //   },
  // });
  //
  // await app.startAllMicroservices();
  await app.listen(9494);
}
bootstrap();

function proxyRequest(req: Request, getUrl: (url: string) => string) {
  const url = getUrl(req.url);
  console.log('Proxying for jellyfin', req.url, url);
  console.log(req.method, req.headers, req.body);
  return fetch(url, {
    method: req.method,
    headers: req.headers,
    body: req.body,
  });
}
