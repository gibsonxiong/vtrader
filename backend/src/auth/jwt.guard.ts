import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { verifyAccessToken } from './jwt-utils';

@Injectable()
export class JwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Unauthorized');
    }
    const token = authHeader.split(' ')[1];
    const userinfo = verifyAccessToken(token);
    if (!userinfo) {
      throw new UnauthorizedException('Unauthorized');
    }
    request.user = userinfo;
    return true;
  }
}
