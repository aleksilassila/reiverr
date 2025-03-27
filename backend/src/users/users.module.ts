import { forwardRef, Module } from '@nestjs/common';
import { SourceProvidersModule } from 'src/source-providers/source-providers.module';
import { userProviders } from './user.providers';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MediaSourcesModule } from 'src/media-sources/media-sources.module';

@Module({
  imports: [forwardRef(() => MediaSourcesModule), SourceProvidersModule],
  providers: [...userProviders, UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
