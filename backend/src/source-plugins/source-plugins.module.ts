import { Module } from '@nestjs/common';
import { DynamicModule } from '@nestjs/common';
import { SourcePluginsService } from './source-plugins.service';
import { SourcesController } from './source-plugins.controller';
import { UsersModule } from 'src/users/users.module';

@Module({
  providers: [SourcePluginsService],
  controllers: [SourcesController],
  exports: [SourcePluginsService],
  imports: [UsersModule],
})
export class SourcePluginsModule {}
