import { Module } from '@nestjs/common';
import { MetadataModule } from 'src/metadata/metadata.module';
import { AdminMediaRequestsController } from './admin-media-requests.controller';
import { MediaRequestsController } from './media-requests.controller';
import { mediaRequestProviders } from './media-requests.providers';
import { MediaRequestsService } from './media-requests.service';

@Module({
  imports: [MetadataModule],
  controllers: [MediaRequestsController, AdminMediaRequestsController],
  providers: [...mediaRequestProviders, MediaRequestsService],
  exports: [MediaRequestsService],
})
export class MediaRequestsModule {}
