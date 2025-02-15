import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TMDB_CACHE_TTL } from 'src/consts';
import { UsersModule } from 'src/users/users.module';
import { TmdbController } from './tmdb.controller';
import { tmdbProviders } from './tmdb.providers';
import { TmdbService } from './tmdb.service';

@Module({
  imports: [
    UsersModule,
    CacheModule.register({ ttl: TMDB_CACHE_TTL, max: 10_000 }),
  ],
  providers: [...tmdbProviders, TmdbService],
  exports: [...tmdbProviders, TmdbService],
  controllers: [TmdbController],
})
export class TmdbModule {}
