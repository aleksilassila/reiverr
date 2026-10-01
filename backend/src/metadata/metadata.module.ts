import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TMDB_CACHE_TTL } from '../consts.js';
import { MetadataController } from './metadata.controller.js';
import { MovieMetadata, SeriesMetadata } from './metadata.entity.js';
import { MetadataService } from './metadata.service.js';
import { TmdbController } from './tmdb/tmdb.controller.js';
import { tmdbProviders } from './tmdb/tmdb.providers.js';
import { TmdbService } from './tmdb/tmdb.service.js';

@Module({
  imports: [
    MikroOrmModule.forFeature([MovieMetadata, SeriesMetadata]),
    CacheModule.register({ ttl: TMDB_CACHE_TTL, max: 10_000 }),
  ],
  providers: [MetadataService, ...tmdbProviders, TmdbService],
  controllers: [TmdbController, MetadataController],
  exports: [MetadataService],
})
export class MetadataModule {}
