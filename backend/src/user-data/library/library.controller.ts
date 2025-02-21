import {
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserAccessControl } from 'src/auth/auth.guard';
import {
  GetPaginationParams,
  PaginatedApiOkResponse,
} from 'src/common/common.decorator';
import {
  MediaType,
  PaginatedResponseDto,
  PaginationParamsDto,
  SuccessResponseDto,
} from 'src/common/common.dto';
import { LibraryItemDto, LibraryItemDto2 } from './library.dto';
import { LibraryService } from './library.service';

@ApiTags('users')
@Controller('users/:userId/library')
@UseGuards(UserAccessControl)
export class LibraryController {
  constructor(private libraryService: LibraryService) {}

  @Get()
  @PaginatedApiOkResponse(LibraryItemDto2)
  async getLibraryItems(
    @GetPaginationParams() pagination: PaginationParamsDto,
    @Param('userId') userId: string,
  ): Promise<PaginatedResponseDto<LibraryItemDto2>> {
    // const user = await this.userService.findOne(userId);

    const items = await this.libraryService.getLibraryItemDtos(
      userId,
      pagination,
    );

    return {
      items,
      itemsPerPage: pagination.itemsPerPage,
      page: pagination.page,
      total: items.length,
    };
  }

  @Put('tmdb/:tmdbId')
  @ApiQuery({ name: 'mediaType', enum: MediaType })
  @ApiOkResponse({
    description: 'Library item added',
    type: SuccessResponseDto,
  })
  async addLibraryItem(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
    @Query('mediaType', new ParseEnumPipe(MediaType)) mediaType: MediaType,
  ): Promise<SuccessResponseDto> {
    const item = await this.libraryService.findOrCreateByTmdbId(
      userId,
      tmdbId,
      mediaType,
    );

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
