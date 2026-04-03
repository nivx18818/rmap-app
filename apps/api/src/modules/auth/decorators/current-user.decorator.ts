import type { ExecutionContext } from '@nestjs/common';

import { createParamDecorator } from '@nestjs/common';

export interface RequestUser {
  id: string;
  email: string;
  fullName?: string;
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user: RequestUser }>();
  return request.user;
});
