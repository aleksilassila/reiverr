import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard, GetUser, OptionalAuthGuard } from '../auth/auth.guard';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto, UserDto } from './user.dto';
import { User } from './user.entity';
import { ApiException } from '@nanogiants/nestjs-swagger-api-exception-decorator';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(AuthGuard)
  @Get()
  @ApiOkResponse({ description: 'User found', type: UserDto })
  @ApiException(() => NotFoundException, { description: 'User not found' })
  async getProfile(@GetUser() user: User): Promise<UserDto> {
    console.log(user);

    if (!user) {
      throw new NotFoundException();
    }

    return UserDto.fromEntity(user);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  @ApiOkResponse({ description: 'User found', type: UserDto })
  @ApiException(() => NotFoundException, { description: 'User not found' })
  async findById(
    @Param('id') id: string,
    @GetUser() callerUser: User,
  ): Promise<UserDto> {
    if (!callerUser.isAdmin && callerUser.id !== id) {
      throw new NotFoundException();
    }

    const user = await this.userService.findOne(id);

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
  @HttpCode(HttpStatus.OK)
  @Post()
  async create(
    @Body()
    userCreateDto: CreateUserDto,
    @GetUser() callerUser: User | undefined,
  ) {
    const canCreateUser =
      (await this.userService.noPreviousAdmins()) || callerUser?.isAdmin;

    if (!canCreateUser) throw new UnauthorizedException();

    const user = await this.userService.create(
      userCreateDto.name,
      userCreateDto.password,
      userCreateDto.isAdmin,
    );

    return UserDto.fromEntity(user);
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  @ApiOkResponse({ description: 'User updated', type: UserDto })
  @ApiException(() => NotFoundException, { description: 'User not found' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() callerUser: User,
  ): Promise<UserDto> {
    if ((!callerUser.isAdmin && callerUser.id !== id) || !id) {
      throw new NotFoundException();
    }

    const user = await this.userService.findOne(id);
    if (updateUserDto.name) user.name = updateUserDto.name;
    if (
      updateUserDto.oldPassword === user.password &&
      updateUserDto.password !== undefined
    )
      user.password = updateUserDto.password;
    else if (
      updateUserDto.password &&
      updateUserDto.oldPassword !== user.password
    )
      throw new BadRequestException("Passwords don't match");
    if (updateUserDto.settings) user.settings = updateUserDto.settings;
    if (updateUserDto.onboardingDone)
      user.onboardingDone = updateUserDto.onboardingDone;
    if (updateUserDto.profilePicture) {
      try {
        user.profilePicture = Buffer.from(
          updateUserDto.profilePicture.split(';base64,').pop() as string,
          'base64',
        );
      } catch (e) {
        console.error(e);
      }
    }

    const updated = await this.userService.update(user);
    return UserDto.fromEntity(updated);
  }
}
