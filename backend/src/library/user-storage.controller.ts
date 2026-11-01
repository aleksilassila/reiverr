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
  StorageUsageDto,
  TitleUsageDto,
  TitleUsageSort,
  TitleUsageStatus,
} from './library.dto.js';
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

  @Get('titles')
  @ApiQuery({ name: 'mediaType', enum: MediaType, required: false })
  @ApiQuery({
    name: 'status',
    enum: TitleUsageStatus,
    required: false,
    description:
      'Titles a request of the user has a file of; without it, every title with files',
  })
  @ApiQuery({
    name: 'letter',
    enum: LETTERS,
    required: false,
    description:
      "Titles whose name starts with the letter; '#' for a name that starts with none",
  })
  @ApiQuery({
    name: 'sort',
    enum: TitleUsageSort,
    required: false,
    description:
      "By what the user's requests hold with the requested status, by every file of the title without",
  })
  @ApiQuery({
    name: 'direction',
    enum: OrderDirection,
    required: false,
    description: 'Without it, the direction natural to the sort',
  })
  @PaginationApiQuery()
  @PaginatedApiOkResponse(TitleUsageDto)
  getUserTitles(
    @GetAuthUser() user: User,
    @GetPaginationParams() pagination: PaginationDto,
    @Query('mediaType', new ParseEnumPipe(MediaType, { optional: true }))
    mediaType?: MediaType,
    @Query('status', new ParseEnumPipe(TitleUsageStatus, { optional: true }))
    status?: TitleUsageStatus,
    @Query('letter', new ParseEnumPipe(LETTERS, { optional: true }))
    letter?: Letter,
    @Query('sort', new ParseEnumPipe(TitleUsageSort, { optional: true }))
    sort?: TitleUsageSort,
    @Query('direction', new ParseEnumPipe(OrderDirection, { optional: true }))
    direction?: OrderDirection,
  ): Promise<PaginatedResponseDto<TitleUsageDto>> {
    return this.storageService.describeUserTitles(user.id, {
      mediaType,
      status,
      letter,
      sort: sort ?? TitleUsageSort.Size,
      direction,
      pagination,
    });
  }
}
