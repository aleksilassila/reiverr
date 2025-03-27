import { Module } from '@nestjs/common';
import { SourceProvidersController } from './source-providers.controller';
import { SourceProvidersService } from './source-providers.service';

@Module({
  imports: [],
  providers: [SourceProvidersService],
  controllers: [SourceProvidersController],
  exports: [SourceProvidersService],
})
export class SourceProvidersModule {}
