import {
  Controller,
  Param,
  ParseBoolPipe,
  ParseEnumPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserAccessControl } from '../../auth/auth.guard.js';
import { MediaType, SuccessResponseDto } from '../../common/common.dto.js';
import { MyListService } from './my-list.service.js';

@ApiTags('myList')
@Controller('users/:userId/my-list')
@UseGuards(UserAccessControl)
export class MyListController {
  constructor(private myListService: MyListService) {}

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
      const item = await this.myListService.findOrCreateByTmdbId(
        userId,
        tmdbId,
        mediaType,
      );

      return {
        success: !!item,
      };
    } else {
      const deleteAction = await this.myListService.deleteByTmdbId(
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
