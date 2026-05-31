import type { ConfigService } from '@nestjs/config';
import type { User } from '@repo/db/prisma/client';
import type { Request } from 'express';

import { UserRole } from '@repo/db/prisma/client';

import type { RefreshTokenService } from '@/modules/auth/refresh-token.service';
import type { UserService } from '@/modules/user/user.service';

import {
  AppUnauthorizedException,
  InternalServerErrorException,
  MissingAuthenticationException,
  RefreshTokenInvalidException,
} from '@/common/exceptions/app.exceptions';
import { JwtRefreshStrategy } from '@/modules/auth/strategies/jwt-refresh.strategy';

const makeUser = (): User => ({
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  email: 'learner@example.test',
  fullName: 'Learner One',
  id: 'user-1',
  passwordHash: 'hash',
  role: UserRole.USER,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

describe('JwtRefreshStrategy', () => {
  const configService = {
    get: jest.fn((key: string) => ({ JWT_REFRESH_SECRET: 'refresh-secret' })[key]),
  };
  const userService = { findById: jest.fn() };
  const refreshTokenService = { findValid: jest.fn() };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('requires JWT_REFRESH_SECRET at construction time', () => {
    expect(
      () =>
        new JwtRefreshStrategy(
          { get: jest.fn() } as unknown as ConfigService,
          userService as unknown as UserService,
          refreshTokenService as unknown as RefreshTokenService,
        ),
    ).toThrow(InternalServerErrorException);
  });

  it('rejects requests without a refresh token cookie', async () => {
    const strategy = makeStrategy();

    await expect(
      strategy.validate({ cookies: {} } as Request, {
        email: 'learner@example.test',
        sub: 'user-1',
      }),
    ).rejects.toThrow(MissingAuthenticationException);
  });

  it('rejects refresh tokens that are not valid in storage', async () => {
    refreshTokenService.findValid.mockResolvedValue(null);
    const strategy = makeStrategy();

    await expect(
      strategy.validate(makeRequest(), { email: 'learner@example.test', sub: 'user-1' }),
    ).rejects.toThrow(RefreshTokenInvalidException);
    expect(refreshTokenService.findValid).toHaveBeenCalledWith('user-1', 'refresh-token');
  });

  it('rejects valid refresh tokens for missing users', async () => {
    refreshTokenService.findValid.mockResolvedValue({ id: 'refresh-1' });
    userService.findById.mockResolvedValue(null);
    const strategy = makeStrategy();

    await expect(
      strategy.validate(makeRequest(), { email: 'missing@example.test', sub: 'user-1' }),
    ).rejects.toThrow(AppUnauthorizedException);
  });

  it('returns the user for a valid stored refresh token', async () => {
    const user = makeUser();
    refreshTokenService.findValid.mockResolvedValue({ id: 'refresh-1' });
    userService.findById.mockResolvedValue(user);
    const strategy = makeStrategy();

    await expect(
      strategy.validate(makeRequest(), { email: user.email, sub: user.id }),
    ).resolves.toEqual(user);
  });

  function makeStrategy() {
    return new JwtRefreshStrategy(
      configService as unknown as ConfigService,
      userService as unknown as UserService,
      refreshTokenService as unknown as RefreshTokenService,
    );
  }

  function makeRequest(): Request {
    return { cookies: { refresh_token: 'refresh-token' } } as unknown as Request;
  }
});
