import { Module } from '@nestjs/common';
import { MetadataModule } from 'src/metadata/metadata.module';
import { SettingsModule } from 'src/settings/settings.module';
import { SourceProvidersModule } from 'src/source-providers/source-providers.module';
import { mediaSourceProviders } from './media-sources/media-source.providers';
import { MediaSourcesController } from './media-sources/media-sources.controller';
import { MediaSourcesService } from './media-sources/media-sources.service';
import { MediaSourcesSettingsController } from './media-sources/media-sources.settings.controller';
import { UserSettingsService } from './user-settings.service';
import { userProviders } from './user.providers';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [SourceProvidersModule, MetadataModule, SettingsModule],
  providers: [
    ...userProviders,
    UsersService,
    ...mediaSourceProviders,
    MediaSourcesService,
    UserSettingsService,
  ],
  controllers: [
    UsersController,
    MediaSourcesController,
    MediaSourcesSettingsController,
  ],
  exports: [UsersService, MediaSourcesService, UserSettingsService],
})
export class UsersModule {}
