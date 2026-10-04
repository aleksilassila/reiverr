import { Module } from '@nestjs/common';
import { DownloadsModule } from '../downloads/downloads.module.js';
import { LocalMediaModule } from '../local-media/local-media.module.js';
import { RequestsModule } from '../requests/requests.module.js';
import { ServerController } from './server.controller.js';
import { ServerService } from './server.service.js';

@Module({
  imports: [LocalMediaModule, RequestsModule, DownloadsModule],
  controllers: [ServerController],
  providers: [ServerService],
})
export class ServerModule {}
