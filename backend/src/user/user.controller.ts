import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard, GetUser } from '../auth/auth.guard';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto, UserDto } from './user.dto';
import { User } from './user.entity';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(AuthGuard)
  @Get()
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiOkResponse({ description: 'User found', type: UserDto })
  async getProfile(@GetUser() user: User): Promise<UserDto> {
    if (!user) {
      throw new NotFoundException();
    }

    return UserDto.fromEntity(user);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  @ApiOkResponse({ description: 'User found', type: UserDto })
  @ApiNotFoundResponse({ description: 'User not found' })
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
}
