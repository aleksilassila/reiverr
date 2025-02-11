import { Module } from '@nestjs/common';
import { MetadataModule } from 'src/metadata/metadata.module';
import { LibraryController } from './library.controller';
import { libraryProviders } from './library.providers';
import { LibraryService } from './library.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  providers: [...libraryProviders, LibraryService],
  controllers: [LibraryController],
  imports: [MetadataModule, UsersModule],
  exports: [LibraryService],
})
export class LibraryModule {}
