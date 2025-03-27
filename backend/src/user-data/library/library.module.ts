import { Module } from '@nestjs/common';
import { MetadataModule } from 'src/metadata/metadata.module';
import { LibraryController } from './library.controller';
import { libraryProviders } from './library.providers';
import { LibraryService } from './library.service';

@Module({
  imports: [MetadataModule],
  providers: [...libraryProviders, LibraryService],
  controllers: [LibraryController],
  exports: [LibraryService],
})
export class LibraryModule {}
