import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserServiceError, UsersService } from './users.service';
import { AuthGuard, GetUser, OptionalAuthGuard } from '../auth/auth.guard';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto, UserDto } from './user.dto';
import { User } from './user.entity';
import { ApiException } from '@nanogiants/nestjs-swagger-api-exception-decorator';

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
  //   return UserDto.fromEntity(user);
  // }

  @UseGuards(AuthGuard)
  @Get('')
  @ApiOkResponse({
    description: 'All users found',
    type: UserDto,
    isArray: true,
  })
  async findAll(@GetUser() callerUser: User): Promise<UserDto[]> {
    if (!callerUser.isAdmin) {
      throw new UnauthorizedException();
    }

    const users = await this.usersService.findAll();

    return users.map((user) => UserDto.fromEntity(user));
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  @ApiOkResponse({ description: 'User found', type: UserDto })
  @ApiException(() => NotFoundException, { description: 'User not found' })
  async findById(
    @Param('id') id: string,
    @GetUser() callerUser: User,
  ): Promise<UserDto> {
    console.log('callerUser', callerUser);
    if (!callerUser.isAdmin && callerUser.id !== id) {
      throw new NotFoundException();
    }

    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new NotFoundException();
    }

    return UserDto.fromEntity(user);
  }

  // @Get('isSetupDone')
  // @ApiOkResponse({ description: 'Setup done', type: Boolean })
  // async isSetupDone() {
  //   return this.userService.noPreviousAdmins();
  // }

  @UseGuards(OptionalAuthGuard)
  @Post()
  @ApiOkResponse({ description: 'User created', type: UserDto })
  @ApiException(() => UnauthorizedException, { description: 'Unauthorized' })
  @ApiException(() => BadRequestException)
  async create(
    @Body()
    userCreateDto: CreateUserDto,
    @GetUser() callerUser: User | undefined,
  ) {
    const canCreateUser =
      (await this.usersService.noPreviousAdmins()) || callerUser?.isAdmin;

    if (!canCreateUser) throw new UnauthorizedException();

    const user = await this.usersService.create(userCreateDto).catch((e) => {
      if (e === UserServiceError.UsernameRequired)
        throw new BadRequestException('Username is required');
      else throw new InternalServerErrorException();
    });

    return UserDto.fromEntity(user);
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  @ApiOkResponse({ description: 'User updated', type: UserDto })
  @ApiException(() => NotFoundException, { description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() callerUser: User,
  ): Promise<UserDto> {
    if ((!callerUser.isAdmin && callerUser.id !== id) || !id) {
      throw new NotFoundException();
    }
    const user = await this.usersService.findOne(id);

    const updated = await this.usersService
      .update(user, callerUser, updateUserDto)
      .catch((e) => {
        console.error(e);
        if (e === UserServiceError.PasswordMismatch) {
          throw new BadRequestException('Password mismatch');
        } else throw new InternalServerErrorException();
      });

    return UserDto.fromEntity(updated);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  @ApiOkResponse({ description: 'User deleted' })
  @ApiException(() => NotFoundException, { description: 'User not found' })
  async deleteUser(@Param('id') id: string, @GetUser() callerUser: User) {
    if ((!callerUser.isAdmin && callerUser.id !== id) || !id) {
      throw new NotFoundException();
    }

    await this.usersService.remove(id);
  }
}
