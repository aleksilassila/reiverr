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
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from 'src/auth/auth.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(AuthGuard)
  @Get()
  async getProfile(@Request() req) {
    const user = await this.userService.findOne((req.user as AuthUser).id);

    if (!user) {
      throw new NotFoundException();
    }

    return user;
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const user = await this.userService.findOne(id);

    if (!user) {
      throw new NotFoundException();
    }

    return user;
  }

  @HttpCode(HttpStatus.OK)
  @Post()
  async create(
    @Body()
    userCreateDto: {
      name: string;
      password: string;
      isAdmin?: boolean;
    },
  ) {
    const canCreateAdmin = await this.userService.noPreviousAdmins();

    return this.userService.create(
      userCreateDto.name,
      userCreateDto.password,
      canCreateAdmin && userCreateDto.isAdmin,
    );
  }
}
