import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/common.dto.js';
import { GetAuthUser, UserAccessControl } from '../auth/auth.guard.js';
import { CreateUserDto, UpdateUserDto, UserDto } from './user.dto.js';
import { User } from './user.entity.js';
import { UserServiceError, UsersService } from './users.service.js';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // @UseGuards(AuthGuard)
  // @Get()
  // @ApiOkResponse({ description: 'User found', type: UserDto })
  // @ApiException(() => NotFoundException, { description: 'User not found' })
  // async getProfile(@GetUser() user: User): Promise<UserDto> {
  //   console.log(user);
  //
  //   if (!user) {
  //     throw new NotFoundException();
  //   }
  //
  //   return this.usersService.getUserDto({ user });
  // }

  @UseGuards(UserAccessControl)
  @Get('')
  @ApiOkResponse({
    description: 'All users found',
    type: UserDto,
    isArray: true,
  })
  async findAllUsers(@GetAuthUser() callerUser: User): Promise<UserDto[]> {
    if (!callerUser.isAdmin) {
      throw new UnauthorizedException();
    }

    const users = await this.usersService.findAll();

    return Promise.all(users.map((user) => this.usersService.getUserDto(user)));
  }

  @UseGuards(UserAccessControl)
  @Get(':id')
  @ApiOkResponse({ description: 'User found', type: UserDto })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: ErrorResponseDto,
  })
  async findUserById(
    @Param('id') id: string,
    @GetAuthUser() callerUser: User,
  ): Promise<UserDto> {
    if (!callerUser.isAdmin && callerUser.id !== id) {
      throw new ForbiddenException();
    }

    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new NotFoundException();
    }

    return this.usersService.getUserDto(user);
  }

  // @Get('isSetupDone')
  // @ApiOkResponse({ description: 'Setup done', type: Boolean })
  // async isSetupDone() {
  //   return this.userService.noPreviousAdmins();
  // }

  @Post()
  @ApiOkResponse({ description: 'User created', type: UserDto })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  async createUser(
    @Body()
    userCreateDto: CreateUserDto,
    @GetAuthUser() callerUser: User | undefined,
  ) {
    const canCreateUser =
      (await this.usersService.noPreviousAdmins()) || callerUser?.isAdmin;

    if (!canCreateUser) throw new UnauthorizedException();

    const user = await this.usersService.create(userCreateDto).catch((e) => {
      if (e === UserServiceError.UsernameRequired)
        throw new BadRequestException('Username is required');
      else throw new InternalServerErrorException();
    });

    if (!user) {
      throw new InternalServerErrorException();
    }

    return this.usersService.getUserDto(user);
  }

  @UseGuards(UserAccessControl)
  @Put(':id')
  @ApiOkResponse({ description: 'User updated', type: UserDto })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: ErrorResponseDto,
  })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetAuthUser() callerUser: User,
  ): Promise<UserDto> {
    if ((!callerUser.isAdmin && callerUser.id !== id) || !id) {
      throw new NotFoundException();
    }

    const updated = await this.usersService
      .update(id, callerUser, updateUserDto)
      .catch((e) => {
        console.error(e);
        if (e === UserServiceError.PasswordMismatch) {
          throw new BadRequestException('Password mismatch');
        } else throw new InternalServerErrorException();
      });

    if (!updated) {
      throw new InternalServerErrorException();
    }

    return this.usersService.getUserDto(updated);
  }

  @UseGuards(UserAccessControl)
  @Delete(':id')
  @ApiOkResponse({ description: 'User deleted' })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: ErrorResponseDto,
  })
  async deleteUser(@Param('id') id: string, @GetAuthUser() callerUser: User) {
    if ((!callerUser.isAdmin && callerUser.id !== id) || !id) {
      throw new NotFoundException();
    }

    await this.usersService.remove(id);
  }
}
