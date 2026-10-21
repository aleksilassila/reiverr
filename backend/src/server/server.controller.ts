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
import {
  CleanupPreviewDto,
  DeleteLibraryEntriesResultDto,
  ScanLibraryResultDto,
  LibraryScanPreviewDto,
} from '../library/library.dto.js';
import { User } from '../users/user.entity.js';
import {
  DeleteLibraryEntriesDto,
  LibraryEntriesDto,
  ManageLibraryEntriesResultDto,
  RequestLibraryEntriesResultDto,
  ScanLibraryDto,
  ServerLibraryEntryDto,
} from './server.dto.js';
import { ServerService } from './server.service.js';

@ApiTags('server')
@Controller('server')
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

  @Get('library/scan')
  @ApiOkResponse({
    type: LibraryScanPreviewDto,
    description: 'What a scan of a library folder would forget',
  })
  previewLibraryScan(
    @Query('folder') folder: string,
  ): Promise<LibraryScanPreviewDto> {
    return this.serverService.previewLibraryScan(folder);
  }

  @Post('library/scan')
  @HttpCode(200)
  @ApiOkResponse({ type: ScanLibraryResultDto })
  scanLibrary(@Body() body: ScanLibraryDto): Promise<ScanLibraryResultDto> {
    return this.serverService.scanLibrary(body?.folder, body?.force === true);
  }

  @Get('library/cleanup')
  @ApiOkResponse({
    type: CleanupPreviewDto,
    description: 'What the cleanup of unretained files would delete now',
  })
  previewCleanup(): Promise<CleanupPreviewDto> {
    return this.serverService.previewCleanup();
  }

  @Post('library/cleanup')
  @HttpCode(200)
  @ApiOkResponse({
    type: CleanupPreviewDto,
    description:
      'Queues the cleanup of unretained files, whatever its schedule. The deletions are logged',
  })
  runCleanup(): Promise<CleanupPreviewDto> {
    return this.serverService.runCleanup();
  }

  @Post('library/request')
  @HttpCode(200)
  @ApiOkResponse({
    type: RequestLibraryEntriesResultDto,
    description:
      'Requests the episodes of the indexed files among the entries for the admin, bound to the files, which keeps them',
  })
  requestLibraryEntries(
    @GetAuthUser() user: User,
    @Body() body: LibraryEntriesDto,
  ): Promise<RequestLibraryEntriesResultDto> {
    return this.serverService.requestLibraryEntries(
      user,
      body?.folder,
      body?.paths,
    );
  }

  @Post('library/manage')
  @HttpCode(200)
  @ApiOkResponse({
    type: ManageLibraryEntriesResultDto,
    description:
      'Marks the indexed files among the entries managed, which the cleanup deletes when no request holds them',
  })
  manageLibraryEntries(
    @Body() body: LibraryEntriesDto,
  ): Promise<ManageLibraryEntriesResultDto> {
    return this.serverService.manageLibraryEntries(body?.folder, body?.paths);
  }

  @Post('library/unmanage')
  @HttpCode(200)
  @ApiOkResponse({
    type: ManageLibraryEntriesResultDto,
    description:
      'Marks the indexed files among the entries external, which the cleanup never deletes',
  })
  unmanageLibraryEntries(
    @Body() body: LibraryEntriesDto,
  ): Promise<ManageLibraryEntriesResultDto> {
    return this.serverService.unmanageLibraryEntries(body?.folder, body?.paths);
  }

  @Post('library/delete')
  @HttpCode(200)
  @ApiOkResponse({ type: DeleteLibraryEntriesResultDto })
  deleteLibraryEntries(
    @GetAuthUser() user: User,
    @Body() body: DeleteLibraryEntriesDto,
  ): Promise<DeleteLibraryEntriesResultDto> {
    return this.serverService.deleteLibraryEntries(
      user,
      body?.folder,
      body?.paths,
    );
  }
}
