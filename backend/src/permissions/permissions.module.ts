import { Module } from '@nestjs/common';
import { MediaModule } from 'src/media/media.module';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';

// Get available permissions
// Get default permissions
// Save default permissions
// Check if user has permission
// (User -> Get permissions / Save permissions)

@Module({
  imports: [MediaModule],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
