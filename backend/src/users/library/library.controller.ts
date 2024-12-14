import { Controller, Delete, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserAccessControl } from 'src/auth/auth.guard';
import { LibraryService } from './library.service';
import {
  PaginatedResponseDto,
  PaginationParamsDto,
  SuccessResponseDto,
} from 'src/common/common.dto';
import { LibraryItemDto } from './library.dto';
import {
  GetPaginationParams,
  PaginatedApiOkResponse,
} from 'src/common/common.decorator';
import { UsersService } from '../users.service';
import { MediaService } from 'src/media/media.service';

@ApiTags('users')
@Controller('users/:userId/library')
@UseGuards(UserAccessControl)
export class LibraryController {
  constructor(
    private userService: UsersService,
    private libraryService: LibraryService,
  ) {}

  @Get()
  @PaginatedApiOkResponse(LibraryItemDto)
  async getLibraryItems(
    @GetPaginationParams() pagination: PaginationParamsDto,
    @Param('userId') userId: string,
  ): Promise<PaginatedResponseDto<LibraryItemDto>> {
    // const user = await this.userService.findOne(userId);

    const items = await this.libraryService.getLibraryItems(userId);

    return {
      items,
      itemsPerPage: pagination.itemsPerPage,
      page: pagination.page,
      total: items.length,
    };
  }

  @Put('tmdb/:tmdbId')
  @ApiOkResponse({
    description: 'Library item added',
    type: SuccessResponseDto,
  })
  async addLibraryItem(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
  ): Promise<SuccessResponseDto> {
    const item = await this.libraryService.findOrCreateByTmdbId(userId, tmdbId);

    return {
      success: !!item,
    };
  }

  @Delete('tmdb/:tmdbId')
  @ApiOkResponse({
    description: 'Library item removed',
    type: SuccessResponseDto,
  })
  async removeLibraryItem(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
  ): Promise<SuccessResponseDto> {
    const deleteAction = await this.libraryService.deleteByTmdbId(
      userId,
      tmdbId,
    );

    return {
      success: deleteAction.affected > 0,
    };
  }
}
