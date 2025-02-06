import { forwardRef, Module } from '@nestjs/common';
import { MetadataController } from './metadata.controller';
import { MetadataService as MetadataService } from './metadata.service';
import { metadataProviders } from './metadata.providers';
import { DatabaseModule } from 'src/database/database.module';
import { TmdbController } from './tmdb/tmdb.controller';
import { tmdbProviders } from './tmdb/tmdb.providers';
import { UsersModule } from 'src/users/users.module';
import { TmdbModule } from './tmdb/tmdb.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => UsersModule), TmdbModule],
  controllers: [MetadataController],
  providers: [...metadataProviders, MetadataService],
  exports: [MetadataService],
})
export class MetadataModule {}
