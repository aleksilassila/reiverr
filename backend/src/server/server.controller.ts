import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminAccessControl, GetAuthUser } from '../auth/auth.guard.js';
import { DeletedLibraryEntriesDto } from '../local-media/local-media.dto.js';
import { User } from '../users/user.entity.js';
import {
  DeleteLibraryEntriesDto,
  ServerLibraryEntryDto,
} from './server.dto.js';
import { ServerService } from './server.service.js';

@ApiTags('server')
@Controller('v2/server')
@UseGuards(AdminAccessControl)
export class ServerController {
  constructor(private readonly serverService: ServerService) {}

  @Get('library')
  @ApiOkResponse({
    type: [ServerLibraryEntryDto],
    description:
      'Everything in a library folder, a directory before what is in it',
  })
  getLibraryEntries(
    @Query('folder') folder: string,
  ): Promise<ServerLibraryEntryDto[]> {
    return this.serverService.getLibraryEntries(folder);
  }

  @Post('library/delete')
  @HttpCode(200)
  @ApiOkResponse({ type: DeletedLibraryEntriesDto })
  deleteLibraryEntries(
    @GetAuthUser() user: User,
    @Body() body: DeleteLibraryEntriesDto,
  ): Promise<DeletedLibraryEntriesDto> {
    return this.serverService.deleteLibraryEntries(
      user,
      body?.folder,
      body?.paths,
    );
  }
}
