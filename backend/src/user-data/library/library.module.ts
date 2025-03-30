import { Module } from '@nestjs/common';
import { MetadataModule } from 'src/metadata/metadata.module';
import { LibraryController } from './library.controller';
import { libraryProviders } from './library.providers';
import { LibraryService } from './library.service';
import { UsersModule } from 'src/users/users.module';
import { SourceProvidersModule } from 'src/source-providers/source-providers.module';
import { playStateProviders } from '../play-state/play-state.providers';

@Module({
  imports: [UsersModule, MetadataModule, SourceProvidersModule],
  providers: [...libraryProviders, ...playStateProviders, LibraryService],
  controllers: [LibraryController],
  exports: [LibraryService],
})
export class LibraryModule {}
