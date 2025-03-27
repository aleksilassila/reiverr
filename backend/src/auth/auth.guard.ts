import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from '../users/user.entity';

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
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const user: User = request['user'];

    if (!user) {
      throw new UnauthorizedException();
    }

    const targetUser = request.params.userId;
    if (targetUser && targetUser !== user.id && user.isAdmin === false) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
