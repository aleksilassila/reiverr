import {
  Controller,
  Get,
  ParseEnumPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { GetAuthUser, UserAccessControl } from '../auth/auth.guard.js';
import {
  GetPaginationParams,
  PaginatedApiOkResponse,
  PaginationApiQuery,
} from '../common/common.decorator.js';
import {
  MediaType,
  OrderDirection,
  PaginatedResponseDto,
  PaginationDto,
} from '../common/common.dto.js';
import { User } from '../users/user.entity.js';
import {
  CatalogTitleDto,
  LibraryOrder,
  LibraryStatus,
  MyListOrder,
  MyListStatus,
} from './catalog.dto.js';
import { CatalogService } from './catalog.service.js';

@ApiTags('catalog')
@Controller('catalog')
@UseGuards(UserAccessControl)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('library')
  @ApiQuery({ name: 'mediaType', enum: MediaType, required: false })
  @ApiQuery({ name: 'status', enum: LibraryStatus, required: false })
  @ApiQuery({ name: 'order', enum: LibraryOrder, required: false })
  @ApiQuery({
    name: 'direction',
    enum: OrderDirection,
    required: false,
    description: 'Without it, the direction natural to the order',
  })
  @PaginationApiQuery()
  @PaginatedApiOkResponse(CatalogTitleDto)
  getLibrary(
    @GetAuthUser() user: User,
    @GetPaginationParams() pagination: PaginationDto,
    @Query('mediaType', new ParseEnumPipe(MediaType, { optional: true }))
    mediaType?: MediaType,
    @Query('status', new ParseEnumPipe(LibraryStatus, { optional: true }))
    status?: LibraryStatus,
    @Query('order', new ParseEnumPipe(LibraryOrder, { optional: true }))
    order?: LibraryOrder,
    @Query('direction', new ParseEnumPipe(OrderDirection, { optional: true }))
    direction?: OrderDirection,
  ): Promise<PaginatedResponseDto<CatalogTitleDto>> {
    return this.catalogService.findLibraryTitles(user.id, {
      mediaType,
      status,
      order: order ?? LibraryOrder.DateAdded,
      direction,
      pagination,
    });
  }

  @Get('my-list')
  @ApiQuery({ name: 'mediaType', enum: MediaType, required: false })
  @ApiQuery({ name: 'status', enum: MyListStatus, required: false })
  @ApiQuery({ name: 'order', enum: MyListOrder, required: false })
  @ApiQuery({
    name: 'direction',
    enum: OrderDirection,
    required: false,
    description: 'Without it, the direction natural to the order',
  })
  @PaginationApiQuery()
  @PaginatedApiOkResponse(CatalogTitleDto)
  getMyList(
    @GetAuthUser() user: User,
    @GetPaginationParams() pagination: PaginationDto,
    @Query('mediaType', new ParseEnumPipe(MediaType, { optional: true }))
    mediaType?: MediaType,
    @Query('status', new ParseEnumPipe(MyListStatus, { optional: true }))
    status?: MyListStatus,
    @Query('order', new ParseEnumPipe(MyListOrder, { optional: true }))
    order?: MyListOrder,
    @Query('direction', new ParseEnumPipe(OrderDirection, { optional: true }))
    direction?: OrderDirection,
  ): Promise<PaginatedResponseDto<CatalogTitleDto>> {
    return this.catalogService.findMyList(user.id, {
      mediaType,
      status,
      order: order ?? MyListOrder.DateAdded,
      direction,
      pagination,
    });
  }
}
