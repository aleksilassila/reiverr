import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard, GetUser } from 'src/auth/auth.guard';
import { UsersService } from '../users.service';
import { User } from '../user.entity';
import { UserDto } from '../user.dto';
import { CreateSourceDto } from './user-source.dto';
import {
  UserSourcesService,
  UserSourcesServiceError,
} from './user-sources.service';

@ApiTags('users')
@Controller('users/:userId/sources')
@UseGuards(AuthGuard)
export class UsersSourcesController {
  constructor(
    private usersService: UsersService,
    private userSourcesService: UserSourcesService,
  ) {}

  @Put(':sourceId')
  @ApiOkResponse({ description: 'Source updated', type: UserDto })
  async updateSource(
    @GetUser() callerUser: User,
    @Param('sourceId') sourceId: string,
    @Param('userId') userId: string,
    @Body() sourceDto: CreateSourceDto,
  ): Promise<UserDto> {
    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.userSourcesService
      .updateUserSource(user, sourceId, sourceDto, callerUser)
      .catch((e) => {
        if (e === UserSourcesServiceError.Unauthorized) {
          throw new UnauthorizedException();
        } else {
          throw new InternalServerErrorException('Failed to update source');
        }
      });

    if (!updatedUser) {
      throw new InternalServerErrorException('Failed to update source');
    }

    return UserDto.fromEntity(updatedUser);
  }

  @Delete(':sourceId')
  @ApiOkResponse({ description: 'Source deleted', type: UserDto })
  async deleteSource(
    @GetUser() callerUser: User,
    @Param('sourceId') sourceId: string,
    @Param('userId') userId: string,
  ): Promise<UserDto> {
    const updatedUser = await this.userSourcesService.deleteUserSource(userId, sourceId, callerUser);

    return UserDto.fromEntity(updatedUser);
  }
}
