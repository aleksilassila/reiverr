import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { MetadataModule } from '../metadata/metadata.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { SourceProvidersModule } from '../source-providers/source-providers.module.js';
import { MediaSource } from './media-sources/media-source.entity.js';
import { MediaSourcesController } from './media-sources/media-sources.controller.js';
import { MediaSourcesService } from './media-sources/media-sources.service.js';
import { MediaSourcesSettingsController } from './media-sources/media-sources.settings.controller.js';
import { UserSettingsService } from './user-settings.service.js';
import { User } from './user.entity.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [
    MikroOrmModule.forFeature([User, MediaSource]),
    SourceProvidersModule,
    MetadataModule,
    SettingsModule,
  ],
  providers: [UsersService, MediaSourcesService, UserSettingsService],
  controllers: [
    UsersController,
    MediaSourcesController,
    MediaSourcesSettingsController,
  ],
  exports: [UsersService, MediaSourcesService, UserSettingsService],
})
export class UsersModule {}
