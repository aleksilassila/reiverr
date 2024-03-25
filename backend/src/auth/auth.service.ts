import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';

interface AccessTokenPayload {
  sub: string;
  name: string;
  isAdmin: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async signIn(
    name: string,
    password: string,
  ): Promise<{
    token: string;
  }> {
    const user = await this.userService.findOneByName(name);

    if (!(user && user.password === password)) {
      throw new UnauthorizedException();
    }

    const payload: AccessTokenPayload = {
      sub: user.id,
      name: user.name,
      isAdmin: user.isAdmin,
    };

    return {
      token: await this.jwtService.signAsync(payload),
    };
  }
}
export type AuthUser = {
  id: string;
  name: string;
  isAdmin: boolean;
};
