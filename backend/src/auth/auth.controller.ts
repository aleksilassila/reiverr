import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from '../user/user.dto';
import {
  ApiOkResponse,
  ApiProperty,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiException } from '@nanogiants/nestjs-swagger-api-exception-decorator';

export class SignInResponse {
  @ApiProperty()
  accessToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @HttpCode(HttpStatus.OK)
  @Post()
  @ApiOkResponse({ description: 'User found', type: SignInResponse })
  @ApiException(() => UnauthorizedException)
  async signIn(@Body() signInDto: SignInDto) {
    const { token } = await this.authService.signIn(
      signInDto.name,
      signInDto.password,
    );
    return {
      accessToken: token,
    };
  }
}
