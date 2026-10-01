import {
  Body,
  Controller,
  Delete,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GetAuthUser, UserAccessControl } from '../../auth/auth.guard.js';
import { UserDto } from '../user.dto.js';
import { User } from '../user.entity.js';
import { UsersService } from '../users.service.js';
import {
  UpdateMediaSourceResponseDto,
  UpdateOrCreateMediaSourceDto,
} from './media-source.dto.js';
import {
  MediaSourcesService,
  MediaSourcesServiceError,
} from './media-sources.service.js';

@ApiTags('users')
@Controller('users/:userId/sources')
@UseGuards(UserAccessControl)
export class MediaSourcesSettingsController {
  constructor(
    private usersService: UsersService,
    private mediaSourcesService: MediaSourcesService,
  ) {}

  @Put()
  @ApiOkResponse({
    description: 'Source updated',
    type: UpdateMediaSourceResponseDto,
  })
  async updateSource(
    @GetAuthUser() callerUser: User,
    @Param('userId') userId: string,
    @Body() sourceDto: UpdateOrCreateMediaSourceDto,
  ): Promise<UpdateMediaSourceResponseDto> {
    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { mediaSource: updatedSource, validationResponse } =
      await this.mediaSourcesService
        .updateOrCreateMediaSource(user, sourceDto, callerUser)
        .catch((e) => {
          if (e === MediaSourcesServiceError.Unauthorized) {
            throw new UnauthorizedException();
          } else {
            throw new InternalServerErrorException('Failed to update source');
          }
        });

    if (!updatedSource) {
      throw new InternalServerErrorException('Failed to update source');
    }

    return {
      mediaSource:
        await this.mediaSourcesService.getMediaSourceDto(updatedSource),
      validationResponse,
    };
  }

  @Delete(':sourceId')
  @ApiOkResponse({ description: 'Source deleted', type: UserDto })
  async deleteSource(
    @GetAuthUser() callerUser: User,
    @Param('sourceId') sourceId: string,
    @Param('userId') userId: string,
  ): Promise<UserDto> {
    const result = await this.mediaSourcesService.deleteMediaSource(
      sourceId,
      callerUser,
    );

    const updatedUser = await this.usersService.findOne(userId);

    return this.usersService.getUserDto(updatedUser);
  }
}
