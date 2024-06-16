import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';

export interface AccessTokenPayload {
  sub: string;
}

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(
    name: string,
    password: string,
  ): Promise<{
    token: string;
    user: User;
  }> {
    let user = await this.userService.findOneByName(name);
    if (!user && (await this.userService.noPreviousAdmins()))
      user = await this.userService.create({
        name,
        password,
        isAdmin: true,
      });

    if (!(user && user.password === password)) {
      throw new UnauthorizedException();
    }

    const payload: AccessTokenPayload = {
      sub: user.id,
    };

    return {
      token: await this.jwtService.signAsync(payload),
      user,
    };
  }
}
