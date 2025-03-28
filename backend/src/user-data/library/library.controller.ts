import {
  BadRequestException,
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
import { GetAuthToken, UserAccessControl } from 'src/auth/auth.guard';
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
import { MediaSourcesService } from 'src/users/media-sources/media-sources.service';
import {
  CatalogueFilter,
  LibraryItemDto,
  MyListFilter,
  MyListSortBy,
  SortByDirection,
} from './library.dto';
import { LibraryService } from './library.service';

@ApiTags('library')
@Controller('users/:userId/library')
@UseGuards(UserAccessControl)
export class LibraryController {
  constructor(
    private libraryService: LibraryService,
    private mediaSourceService: MediaSourcesService,
  ) {}

  @Get('my-list')
  @ApiQuery({ name: 'filter', enum: MyListFilter, required: false })
  @ApiQuery({ name: 'sortBy', enum: MyListSortBy, required: false })
  @ApiQuery({ name: 'direction', enum: SortByDirection, required: false })
  @PaginatedApiOkResponse(LibraryItemDto)
  async getMyList(
    @GetPaginationParams() pagination: PaginationParamsDto,
    @Param('userId') userId: string,
    @Query('filter', new ParseEnumPipe(MyListFilter, { optional: true }))
    filter?: MyListFilter,
    @Query('sortBy', new ParseEnumPipe(MyListSortBy, { optional: true }))
    sortBy?: MyListSortBy,
    @Query('direction', new ParseEnumPipe(SortByDirection, { optional: true }))
    direction?: SortByDirection,
  ): Promise<PaginatedResponseDto<LibraryItemDto>> {
    // const user = await this.userService.findOne(userId);

    const response = await this.libraryService.getMyList({
      userId,
      pagination,
      filter,
      sortBy,
      direction,
    });

    return {
      ...response,
      items: await Promise.all(
        response.items.map((i) => this.libraryService.getLibraryItemDto(i)),
      ),
    };
  }

  @Get('catalogue/:sourceId')
  @PaginatedApiOkResponse(LibraryItemDto)
  async getCatalogue(
    @GetPaginationParams() pagination: PaginationParamsDto,
    @Param('userId') userId: string,
    @Param('sourceId') sourceId: string,
    @GetAuthToken() token: string,
    @Query('filter', new ParseEnumPipe(CatalogueFilter, { optional: true }))
    filter: CatalogueFilter = CatalogueFilter.All,
  ): Promise<PaginatedResponseDto<LibraryItemDto>> {
    const items = this.libraryService.getCatalogueItems({
      sourceId,
      token,
      pagination,
      filter,
    });

    if (!items) {
      throw new BadRequestException();
    }

    return items;
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
    @Query('mediaType', new ParseEnumPipe(MediaType))
    mediaType: MediaType,
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
