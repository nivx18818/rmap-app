import type { ConfigService } from '@nestjs/config';
import type { User } from '@repo/db/prisma/client';

import { UserRole } from '@repo/db/prisma/client';

import type { UserService } from '@/modules/user/user.service';

import {
  AppUnauthorizedException,
  InternalServerErrorException,
} from '@/common/exceptions/app.exceptions';
import { JwtStrategy } from '@/modules/auth/strategies/jwt.strategy';

const makeUser = (): User => ({
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  email: 'learner@example.test',
  fullName: 'Learner One',
  id: 'user-1',
  passwordHash: 'hash',
  role: UserRole.USER,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

describe('JwtStrategy', () => {
  const configService = { get: jest.fn((key: string) => ({ JWT_SECRET: 'secret' })[key]) };
  const userService = { findById: jest.fn() };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('requires JWT_SECRET at construction time', () => {
    expect(
      () =>
        new JwtStrategy(
          { get: jest.fn() } as unknown as ConfigService,
          userService as unknown as UserService,
        ),
    ).toThrow(InternalServerErrorException);
  });

  it('returns the user represented by the JWT payload', async () => {
    const user = makeUser();
    userService.findById.mockResolvedValue(user);
    const strategy = new JwtStrategy(
      configService as unknown as ConfigService,
      userService as unknown as UserService,
    );

    await expect(strategy.validate({ email: user.email, sub: user.id })).resolves.toEqual(user);
    expect(userService.findById).toHaveBeenCalledWith('user-1');
  });

  it('rejects payloads for missing users', async () => {
    userService.findById.mockResolvedValue(null);
    const strategy = new JwtStrategy(
      configService as unknown as ConfigService,
      userService as unknown as UserService,
    );

    await expect(
      strategy.validate({ email: 'missing@example.test', sub: 'missing-user' }),
    ).rejects.toThrow(AppUnauthorizedException);
  });
});
