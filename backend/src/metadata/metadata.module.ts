import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { metadataProviders } from './metadata.providers';
import { MetadataService } from './metadata.service';
import { TmdbModule } from './tmdb/tmdb.module';

@Module({
  imports: [TmdbModule],
  providers: [...metadataProviders, MetadataService],
  exports: [MetadataService],
})
export class MetadataModule {}
