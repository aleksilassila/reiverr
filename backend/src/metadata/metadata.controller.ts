import { Controller, Post, UseGuards } from '@nestjs/common';
import { UserAccessControl } from 'src/auth/auth.guard';
import { MetadataService } from './metadata.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('metadata')
@Controller('metadata')
export class MetadataController {
  constructor(private metadataService: MetadataService) {}

  @UseGuards(UserAccessControl)
  @Post('clear-cache')
  async clearCache() {
    await this.metadataService.clearMetadataCache();
  }
}
