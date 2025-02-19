import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TMDB_CACHE_TTL } from 'src/consts';
import { UsersModule } from 'src/users/users.module';
import { metadataProviders } from './metadata.providers';
import { MetadataService } from './metadata.service';
import { TmdbController } from './tmdb/tmdb.controller';
import { tmdbProviders } from './tmdb/tmdb.providers';
import { TmdbService } from './tmdb/tmdb.service';
import { MetadataController } from './metadata.controller';

@Module({
  imports: [
    UsersModule,
    CacheModule.register({ ttl: TMDB_CACHE_TTL, max: 10_000 }),
  ],
  providers: [
    ...metadataProviders,
    MetadataService,
    ...tmdbProviders,
    TmdbService,
  ],
  controllers: [TmdbController, MetadataController],
  exports: [MetadataService],
})
export class MetadataModule {}
