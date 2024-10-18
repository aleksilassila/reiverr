import { Module } from '@nestjs/common';
import { TmdbController } from './tmdb.controller';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [CacheModule.register({ ttl: 1000 * 60 * 60 * 36 })],
  controllers: [TmdbController],
})
export class TmdbModule {}
