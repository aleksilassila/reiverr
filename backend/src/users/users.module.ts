import { Module } from '@nestjs/common';
import { MetadataModule } from 'src/metadata/metadata.module';
import { SourceProvidersModule } from 'src/source-providers/source-providers.module';
import { mediaSourceProviders } from './media-sources/media-source.providers';
import { MediaSourcesController } from './media-sources/media-sources.controller';
import { MediaSourcesService } from './media-sources/media-sources.service';
import { MediaSourcesSettingsController } from './media-sources/media-sources.settings.controller';
import { userProviders } from './user.providers';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [SourceProvidersModule, MetadataModule],
  providers: [
    ...userProviders,
    UsersService,
    ...mediaSourceProviders,
    MediaSourcesService,
  ],
  controllers: [
    UsersController,
    MediaSourcesController,
    MediaSourcesSettingsController,
  ],
  exports: [UsersService, MediaSourcesService],
})
export class UsersModule {}
