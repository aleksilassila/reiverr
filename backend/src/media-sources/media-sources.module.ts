import { Module } from '@nestjs/common';
import { mediaSourceProviders } from './media-source.providers';
import { MediaSourcesService } from './media-sources.service';
import { MediaSourcesController } from './media-sources.controller';
import { MediaSourcesSettingsController } from './media-sources.settings.controller';
import { SourceProvidersModule } from 'src/source-providers/source-providers.module';
import { MetadataModule } from 'src/metadata/metadata.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule, SourceProvidersModule, MetadataModule],
  providers: [...mediaSourceProviders, MediaSourcesService],
  controllers: [MediaSourcesController, MediaSourcesSettingsController],
  exports: [MediaSourcesService],
})
export class MediaSourcesModule {}
