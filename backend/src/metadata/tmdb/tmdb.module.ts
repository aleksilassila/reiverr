import { Module } from '@nestjs/common';
import { tmdbProviders } from './tmdb.providers';
import { TmdbController } from './tmdb.controller';
import { UsersModule } from 'src/users/users.module';
import { CacheModule } from '@nestjs/cache-manager';
import { TMDB_CACHE_TTL } from 'src/consts';

@Module({
  imports: [
    UsersModule,
    CacheModule.register({ ttl: TMDB_CACHE_TTL, max: 10_000 }),
  ],
  providers: [...tmdbProviders],
  exports: [...tmdbProviders],
  controllers: [TmdbController],
})
export class TmdbModule {}
