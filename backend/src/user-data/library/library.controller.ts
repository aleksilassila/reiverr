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
  GetPaginationParams as GetPaginationQuery,
  PaginatedApiOkResponse,
  PaginationApiQuery,
} from 'src/common/common.decorator';
import {
  MediaType,
  PaginatedResponseDto,
  PaginationDto,
  SuccessResponseDto,
} from 'src/common/common.dto';
import {
  CatalogueTypeFilter as CatalogueTypeFilter,
  LibraryItemDto,
  MyListOrder,
  MyListStatusFilter,
  MyListTypeFilter,
  OrderDirection,
} from './library.dto';
import { LibraryService } from './library.service';

@ApiTags('library')
@Controller('users/:userId/library')
@UseGuards(UserAccessControl)
export class LibraryController {
  constructor(private libraryService: LibraryService) {}

  @Get('my-list')
  @ApiQuery({ name: 'status', enum: MyListStatusFilter, required: false })
  @ApiQuery({ name: 'type', enum: MyListTypeFilter, required: false })
  @ApiQuery({ name: 'order', enum: MyListOrder, required: false })
  @ApiQuery({ name: 'direction', enum: OrderDirection, required: false })
  @PaginationApiQuery()
  @PaginatedApiOkResponse(LibraryItemDto)
  async getMyList(
    @GetPaginationQuery() pagination: PaginationDto,
    @Param('userId') userId: string,
    @Query('status', new ParseEnumPipe(MyListStatusFilter, { optional: true }))
    status?: MyListStatusFilter,
    @Query('type', new ParseEnumPipe(MyListTypeFilter, { optional: true }))
    type?: MyListTypeFilter,
    @Query('order', new ParseEnumPipe(MyListOrder, { optional: true }))
    order?: MyListOrder,
    @Query('direction', new ParseEnumPipe(OrderDirection, { optional: true }))
    direction?: OrderDirection,
  ): Promise<PaginatedResponseDto<LibraryItemDto>> {
    // const user = await this.userService.findOne(userId);

    const response = await this.libraryService.getMyList({
      userId,
      pagination,
      type,
      status,
      order,
      direction,
    });

    return response
  }

  @Get('catalogue/:sourceId')
  @ApiQuery({ name: 'type', enum: CatalogueTypeFilter, required: false })
  @ApiQuery({ name: 'order', required: false })
  @ApiQuery({ name: 'direction', required: false })
  @PaginationApiQuery()
  @PaginatedApiOkResponse(LibraryItemDto)
  async getCatalogue(
    @GetPaginationQuery() pagination: PaginationDto,
    @Param('userId') userId: string,
    @Param('sourceId') sourceId: string,
    @GetAuthToken() token: string,
    @Query('type', new ParseEnumPipe(CatalogueTypeFilter, { optional: true }))
    type?: CatalogueTypeFilter,
    @Query('order')
    order?: string,
    @Query('direction')
    direction?: string,
  ): Promise<PaginatedResponseDto<LibraryItemDto>> {
    const items = await this.libraryService.getCatalogueItems({
      sourceId,
      token,
      pagination,
      type,
      order,
      direction,
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
