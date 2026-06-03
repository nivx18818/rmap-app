/* eslint-disable @typescript-eslint/unbound-method */
import type { Request, Response } from 'express';

import type { AuthService } from '@/modules/auth/auth.service';
import type { RequestUser } from '@/modules/auth/decorators/current-user.decorator';
import type { RefreshTokenService } from '@/modules/auth/refresh-token.service';

import { AuthController } from '@/modules/auth/auth.controller';

describe('AuthController', () => {
  const authService = {
    login: jest.fn(),
    logout: jest.fn(),
    refresh: jest.fn(),
    register: jest.fn(),
  };
  const refreshTokenService = {
    revokeByToken: jest.fn(),
  };
  const response = {
    clearCookie: jest.fn(),
    cookie: jest.fn(),
  } as unknown as Response;
  let controller: AuthController;

  beforeEach(() => {
    controller = new AuthController(
      authService as unknown as AuthService,
      refreshTokenService as unknown as RefreshTokenService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('delegates registration', async () => {
    const dto = {
      email: 'learner@example.test',
      fullName: 'Learner One',
      password: 'CorrectHorseBattery1!',
    };
    const registered = { email: dto.email, fullName: dto.fullName, id: 'user-1' };
    authService.register.mockResolvedValue(registered);

    await expect(controller.register(dto)).resolves.toEqual(registered);
    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('sets access and refresh cookies on login', async () => {
    authService.login.mockResolvedValue(['access-token', 'refresh-token']);

    await expect(
      controller.login(
        { email: 'learner@example.test', password: 'CorrectHorseBattery1!' },
        response,
      ),
    ).resolves.toEqual({ message: 'Login successful' });

    expect(response.cookie).toHaveBeenCalledWith(
      'access_token',
      'access-token',
      expect.any(Object),
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({ path: '/' }),
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({ path: '/api/v1/auth/refresh' }),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh-token',
      expect.objectContaining({ path: '/' }),
    );
  });

  it('revokes the old refresh token and sets rotated cookies on refresh', async () => {
    const user = { email: 'learner@example.test', id: 'user-1' } as RequestUser;
    const request = { cookies: { refresh_token: 'old-refresh-token' } } as unknown as Request;
    authService.refresh.mockResolvedValue(['new-access-token', 'new-refresh-token']);

    await expect(controller.refresh(user, request, response)).resolves.toEqual({
      message: 'Token refreshed',
    });

    expect(refreshTokenService.revokeByToken).toHaveBeenCalledWith('old-refresh-token');
    expect(authService.refresh).toHaveBeenCalledWith('user-1', 'learner@example.test');
    expect(response.clearCookie).toHaveBeenCalledWith('access_token', expect.any(Object));
    expect(response.cookie).toHaveBeenCalledWith(
      'access_token',
      'new-access-token',
      expect.any(Object),
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({ path: '/' }),
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({ path: '/api/v1/auth/refresh' }),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'new-refresh-token',
      expect.objectContaining({ path: '/' }),
    );
  });

  it('clears auth cookies on logout', async () => {
    const user = { id: 'user-1' } as RequestUser;

    await expect(controller.logout(user, response)).resolves.toEqual({
      message: 'Logged out successfully',
    });

    expect(authService.logout).toHaveBeenCalledWith('user-1');
    expect(response.clearCookie).toHaveBeenCalledWith('access_token', expect.any(Object));
    expect(response.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({ path: '/' }),
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({ path: '/api/v1/auth/refresh' }),
    );
  });
});
