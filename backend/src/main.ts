import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as proxy from 'express-http-proxy';
import { NextFunction, Request, Response } from 'express';
import { CsnService } from './csn/csn.service';

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
      const connectedPeers = Array.from(csnService.connections.keys());

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
    '/api/proxy/jellyfin',
    (req: Request, res: Response, next: NextFunction) => {
      // console.log('Proxying for jellyfin', req.url, req);
      proxy('http://192.168.0.129:8096')(req, res, next);
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
