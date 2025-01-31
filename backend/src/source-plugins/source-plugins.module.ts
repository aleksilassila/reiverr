import { Module } from '@nestjs/common';
import { DynamicModule } from '@nestjs/common';
import { SourcePluginsService } from './source-plugins.service';
import { SourcesController } from './source-plugins.controller';
import { UsersModule } from 'src/users/users.module';
import { MetadataModule } from 'src/metadata/metadata.module';

@Module({
  providers: [SourcePluginsService],
  controllers: [SourcesController],
  exports: [SourcePluginsService],
  imports: [UsersModule, MetadataModule],
})
export class SourcePluginsModule {}
