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
import { GetAuthUser, UserAccessControl } from 'src/auth/auth.guard';
import { UserDto } from 'src/users/user.dto';
import { User } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';
import {
  UpdateMediaSourceResponse,
  UpdateOrCreateMediaSourceDto,
} from './media-source.dto';
import {
  MediaSourcesService,
  MediaSourcesServiceError,
} from './media-sources.service';
import { MediaSource } from './media-source.entity';

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
    type: UpdateMediaSourceResponse,
  })
  async updateSource(
    @GetAuthUser() callerUser: User,
    @Param('userId') userId: string,
    @Body() sourceDto: UpdateOrCreateMediaSourceDto,
  ): Promise<UpdateMediaSourceResponse> {
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
      mediaSource: updatedSource,
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
    const updatedUser = await this.mediaSourcesService.deleteMediaSource(
      sourceId,
      callerUser,
    );

    return UserDto.fromEntity(updatedUser);
  }
}
