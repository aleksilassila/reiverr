import { Module } from '@nestjs/common';
import { DynamicModule } from '@nestjs/common';
import { PluginLoaderService } from './plguin-loader.service';
import { SourcePluginsService } from './source-plugins.service';
import { SourcesController } from './sources.controller';
import { UsersModule } from 'src/users/users.module';

@Module({
  providers: [SourcePluginsService],
  controllers: [SourcesController],
  exports: [SourcePluginsService],
  imports: [UsersModule],
})
export class SourceModule {}
