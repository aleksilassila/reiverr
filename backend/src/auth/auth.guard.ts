import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ENV, JWT_SECRET } from '../consts';
import { AccessTokenPayload } from './auth.service';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { Request } from 'express';

export const GetAuthUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export const GetAuthToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return extractTokenFromRequest(request);
  },
);

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
export class UserAccessControl implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private userService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = extractTokenFromRequest(request);

    if (ENV === 'development' && !token) {
      request['user'] = await this.userService.findOneByName('test');
      return true;
    } else if (!token) {
      throw new UnauthorizedException();
    }
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
        request['user'] = user;
      }

      if (!user) {
        throw new UnauthorizedException();
      }

      const targetUser = request.params.userId;
      if (targetUser && targetUser !== user.id && user.isAdmin === false) {
        throw new UnauthorizedException();
      }
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }
}

@Injectable()
export class OptionalAccessControl implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private userService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = extractTokenFromRequest(request);
    if (!token) {
      return true;
    }
    try {
      const payload: AccessTokenPayload = await this.jwtService.verifyAsync(
        token,
        {
          secret: JWT_SECRET,
        },
      );
      if (payload.sub) {
        request['user'] = await this.userService.findOne(payload.sub);
      }
    } catch {
      return true;
    }
    return true;
  }
}
