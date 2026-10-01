import { Module } from '@nestjs/common';
import { SourceProvidersController } from './source-providers.controller.js';
import { SourceProvidersService } from './source-providers.service.js';

@Module({
  imports: [],
  providers: [SourceProvidersService],
  controllers: [SourceProvidersController],
  exports: [SourceProvidersService],
})
export class SourceProvidersModule {}
