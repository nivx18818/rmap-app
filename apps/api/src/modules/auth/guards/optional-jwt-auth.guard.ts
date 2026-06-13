import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = any>(err: unknown, user: any): TUser {
    if (err || !user) {
      return null as unknown as TUser;
    }
    return user as TUser;
  }
}
