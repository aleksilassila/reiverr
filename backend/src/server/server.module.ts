import { Module } from '@nestjs/common';
import { LibraryModule } from '../library/library.module.js';
import { RequestsModule } from '../requests/requests.module.js';
import { ServerController } from './server.controller.js';
import { ServerService } from './server.service.js';

@Module({
  imports: [LibraryModule, RequestsModule],
  controllers: [ServerController],
  providers: [ServerService],
})
export class ServerModule {}
