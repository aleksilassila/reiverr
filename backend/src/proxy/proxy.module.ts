import { Module } from '@nestjs/common';
import { TmdbModule } from './tmdb/tmdb.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [TmdbModule],
})
export class ProxyModule {}
