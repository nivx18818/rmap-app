/* eslint-disable @typescript-eslint/unbound-method */
import type { Request, Response } from 'express';

import { OAuthProvider } from '@repo/db/prisma/client';

import type { AuthService } from '@/modules/auth/auth.service';
import type { RequestUser } from '@/modules/auth/decorators/current-user.decorator';
import type { RefreshTokenService } from '@/modules/auth/refresh-token.service';

import { InvalidCredentialsException } from '@/common/exceptions/app.exceptions';
import { AuthController } from '@/modules/auth/auth.controller';

describe('AuthController', () => {
  const authService = {
    changePassword: jest.fn(),
    getOAuthFailureRedirectUrl: jest.fn(),
    getOAuthRedirectUrl: jest.fn(),
    login: jest.fn(),
    loginWithOAuth: jest.fn(),
    logout: jest.fn(),
    refresh: jest.fn(),
    register: jest.fn(),
  };
  const refreshTokenService = {
    markRotatedByToken: jest.fn(),
  };
  const response = {
    clearCookie: jest.fn(),
    cookie: jest.fn(),
    redirect: jest.fn(),
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
    expect(response.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh-token',
      expect.objectContaining({ path: '/' }),
    );
  });

  it('sets auth cookies and redirects on OAuth callback', async () => {
    authService.loginWithOAuth.mockResolvedValue(['oauth-access-token', 'oauth-refresh-token']);
    authService.getOAuthRedirectUrl.mockReturnValue('http://localhost:3000/dashboard');

    const req = {
      query: { state: '/dashboard' },
      user: {
        email: 'learner@example.test',
        emailVerified: true,
        fullName: 'Learner One',
        provider: OAuthProvider.GOOGLE,
        providerAccountId: 'google-123',
      },
    } as unknown as Parameters<AuthController['googleCallback']>[0];

    await controller.googleCallback(req, response);

    expect(authService.loginWithOAuth).toHaveBeenCalledWith({
      email: 'learner@example.test',
      emailVerified: true,
      fullName: 'Learner One',
      provider: OAuthProvider.GOOGLE,
      providerAccountId: 'google-123',
    });
    expect(response.cookie).toHaveBeenCalledWith(
      'access_token',
      'oauth-access-token',
      expect.any(Object),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'oauth-refresh-token',
      expect.any(Object),
    );
    expect(authService.getOAuthRedirectUrl).toHaveBeenCalledWith('/dashboard');
    expect(response.redirect).toHaveBeenCalledWith('http://localhost:3000/dashboard');
  });

  it('redirects to sign-in when OAuth callback has no profile', async () => {
    authService.getOAuthFailureRedirectUrl.mockReturnValue(
      'http://localhost:3000/sign-in?error=oauth_failed&callbackUrl=%2Fdashboard',
    );

    const req = {
      query: { state: '/dashboard' },
    } as unknown as Parameters<AuthController['googleCallback']>[0];

    await controller.googleCallback(req, response);

    expect(authService.loginWithOAuth).not.toHaveBeenCalled();
    expect(authService.getOAuthFailureRedirectUrl).toHaveBeenCalledWith('/dashboard');
    expect(response.redirect).toHaveBeenCalledWith(
      'http://localhost:3000/sign-in?error=oauth_failed&callbackUrl=%2Fdashboard',
    );
  });

  it('redirects to sign-in when OAuth profile is rejected', async () => {
    authService.loginWithOAuth.mockRejectedValue(new InvalidCredentialsException());
    authService.getOAuthFailureRedirectUrl.mockReturnValue(
      'http://localhost:3000/sign-in?error=oauth_failed&callbackUrl=%2Fdashboard',
    );

    const req = {
      query: { state: '/dashboard' },
      user: {
        email: 'learner@example.test',
        emailVerified: false,
        fullName: 'Learner One',
        provider: OAuthProvider.GOOGLE,
        providerAccountId: 'google-123',
      },
    } as unknown as Parameters<AuthController['googleCallback']>[0];

    await controller.googleCallback(req, response);

    expect(authService.getOAuthFailureRedirectUrl).toHaveBeenCalledWith('/dashboard');
    expect(response.redirect).toHaveBeenCalledWith(
      'http://localhost:3000/sign-in?error=oauth_failed&callbackUrl=%2Fdashboard',
    );
  });

  it('marks the old refresh token rotated and sets auth cookies on refresh', async () => {
    const user = { email: 'learner@example.test', id: 'user-1' } as RequestUser;
    const request = { cookies: { refresh_token: 'old-refresh-token' } } as unknown as Request;
    authService.refresh.mockResolvedValue(['new-access-token', 'new-refresh-token']);

    await expect(controller.refresh(user, request, response)).resolves.toEqual({
      message: 'Token refreshed',
    });

    expect(authService.refresh).toHaveBeenCalledWith('user-1', 'learner@example.test');
    expect(refreshTokenService.markRotatedByToken).toHaveBeenCalledWith('old-refresh-token');
    const refreshCallOrder = authService.refresh.mock.invocationCallOrder[0];
    const markRotatedCallOrder = refreshTokenService.markRotatedByToken.mock.invocationCallOrder[0];
    if (refreshCallOrder === undefined || markRotatedCallOrder === undefined) {
      throw new Error('Expected refresh token rotation call order to be recorded');
    }
    expect(refreshCallOrder).toBeLessThan(markRotatedCallOrder);
    expect(response.cookie).toHaveBeenCalledWith(
      'access_token',
      'new-access-token',
      expect.any(Object),
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
  });

  it('changes password and clears auth cookies', async () => {
    const user = { id: 'user-1' } as RequestUser;
    const dto = {
      currentPassword: 'CorrectHorseBattery1!',
      newPassword: 'N3wS3cur3P@ss',
    };

    await expect(controller.changePassword(user, dto, response)).resolves.toEqual({
      message: 'Password changed successfully',
    });

    expect(authService.changePassword).toHaveBeenCalledWith('user-1', dto);
    expect(response.clearCookie).toHaveBeenCalledWith('access_token', expect.any(Object));
    expect(response.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({ path: '/api/v1/auth/refresh' }),
    );
  });
});
