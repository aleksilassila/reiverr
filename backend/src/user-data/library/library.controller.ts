import {
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseEnumPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserAccessControl } from '../../auth/auth.guard.js';
import {
  GetPaginationParams,
  PaginatedApiOkResponse,
  PaginationApiQuery,
} from '../../common/common.decorator.js';
import {
  MediaType,
  PaginatedResponseDto,
  PaginationDto,
  SuccessResponseDto,
} from '../../common/common.dto.js';
import {
  MyListItemDto,
  MyListOrder,
  MyListStatusFilter,
  MyListTypeFilter,
  OrderDirection,
} from './library.dto.js';
import { LibraryService } from './library.service.js';

@ApiTags('myList')
@Controller('users/:userId/my-list')
@UseGuards(UserAccessControl)
export class LibraryController {
  constructor(private libraryService: LibraryService) {}

  @Get()
  @ApiQuery({ name: 'status', enum: MyListStatusFilter, required: false })
  @ApiQuery({ name: 'type', enum: MyListTypeFilter, required: false })
  @ApiQuery({ name: 'order', enum: MyListOrder, required: false })
  @ApiQuery({ name: 'direction', enum: OrderDirection, required: false })
  @PaginationApiQuery()
  @PaginatedApiOkResponse(MyListItemDto)
  async getMyList(
    @GetPaginationParams() pagination: PaginationDto,
    @Param('userId') userId: string,
    @Query('status', new ParseEnumPipe(MyListStatusFilter, { optional: true }))
    status?: MyListStatusFilter,
    @Query('type', new ParseEnumPipe(MyListTypeFilter, { optional: true }))
    type?: MyListTypeFilter,
    @Query('order', new ParseEnumPipe(MyListOrder, { optional: true }))
    order?: MyListOrder,
    @Query('direction', new ParseEnumPipe(OrderDirection, { optional: true }))
    direction?: OrderDirection,
  ): Promise<PaginatedResponseDto<MyListItemDto>> {
    // const user = await this.userService.findOne(userId);

    const response = await this.libraryService.getMyList({
      userId,
      pagination,
      type,
      status,
      order,
      direction,
    });

    return response;
  }

  @Put(':tmdbId')
  @ApiQuery({ name: 'mediaType', enum: MediaType })
  @ApiQuery({ name: 'inMyList', type: Boolean })
  @ApiOkResponse({
    description: 'Whether the item is in the list now',
    type: SuccessResponseDto,
  })
  async setMyListItem(
    @Param('userId') userId: string,
    @Param('tmdbId') tmdbId: string,
    @Query('inMyList', new ParseBoolPipe()) inMyList: boolean,
    @Query('mediaType', new ParseEnumPipe(MediaType))
    mediaType: MediaType,
  ): Promise<SuccessResponseDto> {
    if (inMyList) {
      const item = await this.libraryService.findOrCreateByTmdbId(
        userId,
        tmdbId,
        mediaType,
      );

      return {
        success: !!item,
      };
    } else {
      const deleteAction = await this.libraryService.deleteByTmdbId(
        userId,
        tmdbId,
        mediaType,
      );

      return {
        success: deleteAction > 0,
      };
    }
  }
}
