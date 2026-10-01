import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module.js';
import { PermissionsController } from './permissions.controller.js';
import { PermissionsService } from './permissions.service.js';

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
