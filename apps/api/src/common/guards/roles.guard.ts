import type { UserRole } from '@repo/db/prisma/client';

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '@/common/decorators/roles.decorator';
import { AppForbiddenException } from '@/common/exceptions/app.exceptions';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: { role?: unknown } }>();
    const userRole = request.user?.role;

    if (typeof userRole === 'string' && requiredRoles.includes(userRole as UserRole)) {
      return true;
    }

    throw new AppForbiddenException();
  }
}
