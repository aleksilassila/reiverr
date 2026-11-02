import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GetAuthUser, UserAccessControl } from '../auth/auth.guard.js';
import { User } from '../users/user.entity.js';
import { StorageUsageDto } from './library.dto.js';
import { StorageService } from './storage.service.js';

/** What the requests of the user of the session take */
@ApiTags('library')
@Controller('me/storage')
@UseGuards(UserAccessControl)
export class UserStorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get()
  @ApiOkResponse({
    type: StorageUsageDto,
    description: 'The quota of the user and what their requests take',
  })
  getUserStorage(@GetAuthUser() user: User): Promise<StorageUsageDto> {
    return this.storageService.describeUser(user.id);
  }
}
