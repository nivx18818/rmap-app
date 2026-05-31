import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';

import { UserRole } from '@repo/db/prisma/client';

import { ROLES_KEY } from '@/common/decorators/roles.decorator';
import { AppForbiddenException } from '@/common/exceptions/app.exceptions';
import { RolesGuard } from '@/common/guards/roles.guard';

describe('RolesGuard', () => {
  const handler = jest.fn();
  class TestController {}

  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;

  const createContext = (user?: { role?: string }): ExecutionContext =>
    ({
      getClass: () => TestController,
      getHandler: () => handler,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  let guard: RolesGuard;

  beforeEach(() => {
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('allows admin users when admin role metadata is required', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(guard.canActivate(createContext({ role: UserRole.ADMIN }))).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [handler, TestController]);
  });

  it('rejects authenticated non-admin users with AppForbiddenException', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(() => guard.canActivate(createContext({ role: UserRole.USER }))).toThrow(
      AppForbiddenException,
    );
  });

  it('allows routes with no role metadata', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(createContext())).toBe(true);
  });
});
