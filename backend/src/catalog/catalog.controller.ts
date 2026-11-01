import {
  Controller,
  Get,
  ParseEnumPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GetAuthUser, UserAccessControl } from '../auth/auth.guard.js';
import {
  GetPaginationParams,
  PaginatedApiOkResponse,
  PaginationApiQuery,
} from '../common/common.decorator.js';
import {
  LETTERS,
  type Letter,
  MediaType,
  OrderDirection,
  PaginatedResponseDto,
  PaginationDto,
} from '../common/common.dto.js';
import { User } from '../users/user.entity.js';
import {
  CatalogDownloadDto,
  CatalogTitleDto,
  DownloadsOrder,
  DownloadsStatus,
  MyListAvailability,
  MyListOrder,
  MyListStatus,
} from './catalog.dto.js';
import { CatalogService } from './catalog.service.js';

@ApiTags('catalog')
@Controller('catalog')
@UseGuards(UserAccessControl)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('my-list')
  @ApiQuery({ name: 'mediaType', enum: MediaType, required: false })
  @ApiQuery({ name: 'status', enum: MyListStatus, required: false })
  @ApiQuery({
    name: 'availability',
    enum: MyListAvailability,
    required: false,
    description: 'Whether what the user would watch next is on disk',
  })
  @ApiQuery({
    name: 'letter',
    enum: LETTERS,
    required: false,
    description:
      "Titles whose name starts with the letter; '#' for a name that starts with none",
  })
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
    @Query(
      'availability',
      new ParseEnumPipe(MyListAvailability, { optional: true }),
    )
    availability?: MyListAvailability,
    @Query('letter', new ParseEnumPipe(LETTERS, { optional: true }))
    letter?: Letter,
    @Query('order', new ParseEnumPipe(MyListOrder, { optional: true }))
    order?: MyListOrder,
    @Query('direction', new ParseEnumPipe(OrderDirection, { optional: true }))
    direction?: OrderDirection,
  ): Promise<PaginatedResponseDto<CatalogTitleDto>> {
    return this.catalogService.findMyList(user.id, {
      mediaType,
      status,
      availability,
      letter,
      order: order ?? MyListOrder.DateAdded,
      direction,
      pagination,
    });
  }

  @Get('downloads')
  @ApiQuery({ name: 'mediaType', enum: MediaType, required: false })
  @ApiQuery({
    name: 'status',
    enum: DownloadsStatus,
    required: false,
    description:
      'Torrents a request of the user waits for; without it, every torrent that is downloading',
  })
  @ApiQuery({
    name: 'letter',
    enum: LETTERS,
    required: false,
    description:
      "Titles whose name starts with the letter; '#' for a name that starts with none",
  })
  @ApiQuery({ name: 'order', enum: DownloadsOrder, required: false })
  @ApiQuery({
    name: 'direction',
    enum: OrderDirection,
    required: false,
    description: 'Without it, the direction natural to the order',
  })
  @ApiOkResponse({
    type: [CatalogDownloadDto],
    description:
      'The torrents that are downloading, as the engine has them, each with the title it downloads; polled while there are any',
  })
  getDownloads(
    @GetAuthUser() user: User,
    @Query('mediaType', new ParseEnumPipe(MediaType, { optional: true }))
    mediaType?: MediaType,
    @Query('status', new ParseEnumPipe(DownloadsStatus, { optional: true }))
    status?: DownloadsStatus,
    @Query('letter', new ParseEnumPipe(LETTERS, { optional: true }))
    letter?: Letter,
    @Query('order', new ParseEnumPipe(DownloadsOrder, { optional: true }))
    order?: DownloadsOrder,
    @Query('direction', new ParseEnumPipe(OrderDirection, { optional: true }))
    direction?: OrderDirection,
  ): Promise<CatalogDownloadDto[]> {
    return this.catalogService.findDownloads(user.id, {
      mediaType,
      status,
      letter,
      order: order ?? DownloadsOrder.Size,
      direction,
    });
  }
}
