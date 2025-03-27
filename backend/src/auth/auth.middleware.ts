import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request } from 'express';
import { ENV, JWT_SECRET } from 'src/consts';
import { User } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';
import { AccessTokenPayload } from './auth.service';

function extractTokenFromRequest(request: Request): string | undefined {
  const [type, token] =
    (request.headers as any).authorization?.split(' ') ?? [];

  const v = type === 'Bearer' ? token : undefined;

  if (v) return v;

  return request.query['reiverr_token']
    ? (request.query['reiverr_token'] as string)
    : undefined;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private userService: UsersService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = extractTokenFromRequest(req);

    if (ENV === 'development' && !token) {
      req['user'] = await this.userService.findOneByName('test');
    } else {
      try {
        const payload: AccessTokenPayload = await this.jwtService.verifyAsync(
          token,
          {
            secret: JWT_SECRET,
          },
        );

        let user: User;
        if (payload.sub) {
          user = await this.userService.findOne(payload.sub);
          req['user'] = user;
        }
      } catch {}
    }

    return next();
  }
}
