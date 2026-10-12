import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { SignInDto, UserDto } from '../users/user.dto.js';
import {
  ApiOkResponse,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/common.dto.js';
import { UsersService } from '../users/users.service.js';

export class SignInResponseDto {
  @ApiProperty()
  accessToken: string;
  @ApiProperty()
  user: UserDto;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post()
  @ApiOkResponse({ description: 'User found', type: SignInResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  async signIn(@Body() signInDto: SignInDto) {
    const { token, user } = await this.authService.signIn(
      signInDto.name,
      signInDto.password,
    );

    return {
      accessToken: token,
      user: await this.usersService.getUserDto(user),
    };
  }
}
