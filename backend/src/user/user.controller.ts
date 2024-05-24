import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard, GetUser } from '../auth/auth.guard';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto, UserDto } from './user.dto';
import { Settings, User } from './user.entity';
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

  @HttpCode(HttpStatus.OK)
  @Post()
  async create(
    @Body()
    userCreateDto: CreateUserDto,
  ) {
    const canCreateAdmin = await this.userService.noPreviousAdmins();

    const user = await this.userService.create(
      userCreateDto.name,
      userCreateDto.password,
      canCreateAdmin && userCreateDto.isAdmin,
    );

    return UserDto.fromEntity(user);
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  @ApiOkResponse({ description: 'User updated', type: UserDto })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() callerUser: User,
  ): Promise<UserDto> {
    if ((!callerUser.isAdmin && callerUser.id !== id) || !id) {
      throw new NotFoundException();
    }

    const user = await this.userService.findOne(id);
    if (updateUserDto.settings) user.settings = updateUserDto.settings;
    if (updateUserDto.onboardingDone)
      user.onboardingDone = updateUserDto.onboardingDone;

    const updated = await this.userService.update(user);
    return UserDto.fromEntity(updated);
  }
}
