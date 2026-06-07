import type { TestingModule } from '@nestjs/testing';
import type { User } from '@repo/db/prisma/client';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { OAuthProvider, UserRole } from '@repo/db/prisma/client';
import * as bcrypt from 'bcrypt';

import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  UserNotFoundException,
} from '@/common/exceptions/app.exceptions';
import { AuthService } from '@/modules/auth/auth.service';
import { PasswordResetDeliveryService } from '@/modules/auth/password-reset-delivery.service';
import { PasswordResetTokenService } from '@/modules/auth/password-reset-token.service';
import { RefreshTokenService } from '@/modules/auth/refresh-token.service';
import { UsersService } from '@/modules/users/users.service';

const DEFAULT_AVATAR_URL = 'https://api.dicebear.com/10.x/adventurer/svg?seed=Learner%20One';

const makeUser = (overrides: Partial<User> = {}): User => ({
  avatarUrl: DEFAULT_AVATAR_URL,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  email: 'learner@example.test',
  fullName: 'Learner One',
  id: 'user-1',
  passwordHash: '$2b$10$placeholder',
  role: UserRole.USER,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;

  const userService = {
    create: jest.fn(),
    createWithOAuth: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByOAuthAccount: jest.fn(),
    linkOAuthAccount: jest.fn(),
    updatePasswordHash: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn(),
  };
  const configService = {
    get: jest.fn((key: string, fallback?: string) => {
      const values: Record<string, string> = {
        CLIENT_URL: 'http://localhost:3000',
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
        JWT_REFRESH_SECRET: 'refresh-secret',
        JWT_SECRET: 'access-secret',
      };

      return values[key] ?? fallback;
    }),
  };
  const refreshTokenService = {
    create: jest.fn(),
    revokeAllByUser: jest.fn(),
  };
  const passwordResetTokenService = {
    consume: jest.fn(),
    create: jest.fn(),
  };
  const passwordResetDeliveryService = {
    sendResetInstructions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: RefreshTokenService, useValue: refreshTokenService },
        { provide: PasswordResetTokenService, useValue: passwordResetTokenService },
        { provide: PasswordResetDeliveryService, useValue: passwordResetDeliveryService },
      ],
    }).compile();

    service = module.get(AuthService);
    jwtService.signAsync.mockImplementation((_payload, options: { secret: string }) =>
      Promise.resolve(options.secret === 'access-secret' ? 'access-token' : 'refresh-token'),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registers a user with a hashed password and omits passwordHash from the response', async () => {
    let createdPasswordHash = '';
    userService.findByEmail.mockResolvedValue(null);
    userService.create.mockImplementation((data: { passwordHash: string; avatarUrl?: string }) => {
      createdPasswordHash = data.passwordHash;
      return Promise.resolve(
        makeUser({ passwordHash: data.passwordHash, avatarUrl: data.avatarUrl }),
      );
    });

    const result = await service.register({
      email: 'learner@example.test',
      fullName: 'Learner One',
      password: 'CorrectHorseBattery1!',
    });

    expect(userService.create).toHaveBeenCalledWith({
      email: 'learner@example.test',
      fullName: 'Learner One',
      passwordHash: expect.any(String) as string,
      avatarUrl: expect.stringMatching(
        /^https:\/\/api\.dicebear\.com\/10\.x\/adventurer\/svg\?seed=[a-f0-9-]+$/,
      ) as unknown as string,
    });
    expect(createdPasswordHash).not.toBe('CorrectHorseBattery1!');
    expect(result).toEqual({
      createdAt: expect.any(Date) as Date,
      email: 'learner@example.test',
      fullName: 'Learner One',
      avatarUrl: expect.stringMatching(
        /^https:\/\/api\.dicebear\.com\/10\.x\/adventurer\/svg\?seed=[a-f0-9-]+$/,
      ) as unknown as string,
      id: 'user-1',
      role: UserRole.USER,
      updatedAt: expect.any(Date) as Date,
    });
  });

  it('rejects duplicate registration emails', async () => {
    userService.findByEmail.mockResolvedValue(makeUser());

    await expect(
      service.register({
        email: 'learner@example.test',
        fullName: 'Learner One',
        password: 'CorrectHorseBattery1!',
      }),
    ).rejects.toThrow(EmailAlreadyExistsException);
    expect(userService.create).not.toHaveBeenCalled();
  });

  it('logs in with valid credentials and persists the refresh token hash record', async () => {
    const passwordHash = await bcrypt.hash('CorrectHorseBattery1!', 10);
    userService.findByEmail.mockResolvedValue(makeUser({ passwordHash }));

    const result = await service.login({
      email: 'learner@example.test',
      password: 'CorrectHorseBattery1!',
    });

    expect(result).toEqual(['access-token', 'refresh-token']);
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      { email: 'learner@example.test', sub: 'user-1' },
      { expiresIn: '15m', secret: 'access-secret' },
    );
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      {
        email: 'learner@example.test',
        jti: expect.any(String) as string,
        sub: 'user-1',
      },
      { expiresIn: '7d', secret: 'refresh-secret' },
    );
    expect(refreshTokenService.create).toHaveBeenCalledWith(
      'user-1',
      'refresh-token',
      expect.any(Date),
    );
  });

  it('rejects login for missing users and invalid passwords', async () => {
    userService.findByEmail.mockResolvedValueOnce(null);

    await expect(
      service.login({ email: 'missing@example.test', password: 'CorrectHorseBattery1!' }),
    ).rejects.toThrow(InvalidCredentialsException);

    userService.findByEmail.mockResolvedValueOnce(makeUser({ passwordHash: null }));

    await expect(
      service.login({ email: 'learner@example.test', password: 'CorrectHorseBattery1!' }),
    ).rejects.toThrow(InvalidCredentialsException);

    const passwordHash = await bcrypt.hash('CorrectHorseBattery1!', 10);
    userService.findByEmail.mockResolvedValueOnce(makeUser({ passwordHash }));

    await expect(
      service.login({ email: 'learner@example.test', password: 'WrongPassword1!' }),
    ).rejects.toThrow(InvalidCredentialsException);
  });

  it('rejects password login for OAuth-only users', async () => {
    userService.findByEmail.mockResolvedValue(makeUser({ passwordHash: null }));

    await expect(
      service.login({ email: 'learner@example.test', password: 'CorrectHorseBattery1!' }),
    ).rejects.toThrow(InvalidCredentialsException);
  });

  it('logs in with an existing OAuth account', async () => {
    userService.findByOAuthAccount.mockResolvedValue(makeUser({ id: 'oauth-user-1' }));

    const result = await service.loginWithOAuth({
      email: 'learner@example.test',
      emailVerified: true,
      fullName: 'Learner One',
      provider: OAuthProvider.GOOGLE,
      providerAccountId: 'google-123',
    });

    expect(result).toEqual(['access-token', 'refresh-token']);
    expect(userService.findByOAuthAccount).toHaveBeenCalledWith({
      provider: OAuthProvider.GOOGLE,
      providerAccountId: 'google-123',
      providerEmail: 'learner@example.test',
    });
    expect(userService.findByEmail).not.toHaveBeenCalled();
    expect(userService.createWithOAuth).not.toHaveBeenCalled();
    expect(userService.linkOAuthAccount).not.toHaveBeenCalled();
  });

  it('links OAuth to an existing verified email user', async () => {
    const existingUser = makeUser({ id: 'existing-user-1' });
    userService.findByOAuthAccount.mockResolvedValue(null);
    userService.findByEmail.mockResolvedValue(existingUser);
    userService.linkOAuthAccount.mockResolvedValue(existingUser);

    const result = await service.loginWithOAuth({
      email: 'learner@example.test',
      emailVerified: true,
      fullName: 'Learner One',
      provider: OAuthProvider.GITHUB,
      providerAccountId: 'github-123',
    });

    expect(result).toEqual(['access-token', 'refresh-token']);
    expect(userService.createWithOAuth).not.toHaveBeenCalled();
    expect(userService.linkOAuthAccount).toHaveBeenCalledWith('existing-user-1', {
      provider: OAuthProvider.GITHUB,
      providerAccountId: 'github-123',
      providerEmail: 'learner@example.test',
    });
  });

  it('creates a user and OAuth account for a new verified email', async () => {
    const createdUser = makeUser({
      email: 'new-oauth@example.test',
      fullName: 'New OAuth User',
      id: 'new-oauth-user-1',
      passwordHash: null,
    });
    userService.findByOAuthAccount.mockResolvedValue(null);
    userService.findByEmail.mockResolvedValue(null);
    userService.createWithOAuth.mockResolvedValue(createdUser);

    const result = await service.loginWithOAuth({
      email: 'new-oauth@example.test',
      emailVerified: true,
      fullName: 'New OAuth User',
      provider: OAuthProvider.GOOGLE,
      providerAccountId: 'google-456',
    });

    expect(result).toEqual(['access-token', 'refresh-token']);
    expect(userService.createWithOAuth).toHaveBeenCalledWith(
      {
        email: 'new-oauth@example.test',
        fullName: 'New OAuth User',
        avatarUrl: expect.stringMatching(
          /^https:\/\/api\.dicebear\.com\/10\.x\/adventurer\/svg\?seed=[a-f0-9-]+$/,
        ) as unknown as string,
      },
      {
        provider: OAuthProvider.GOOGLE,
        providerAccountId: 'google-456',
        providerEmail: 'new-oauth@example.test',
      },
    );
  });

  it('rejects OAuth profiles without a verified email', async () => {
    await expect(
      service.loginWithOAuth({
        email: 'learner@example.test',
        emailVerified: false,
        fullName: 'Learner One',
        provider: OAuthProvider.GOOGLE,
        providerAccountId: 'google-123',
      }),
    ).rejects.toThrow(InvalidCredentialsException);

    await expect(
      service.loginWithOAuth({
        email: '',
        emailVerified: true,
        fullName: 'Learner One',
        provider: OAuthProvider.GITHUB,
        providerAccountId: 'github-123',
      }),
    ).rejects.toThrow(InvalidCredentialsException);
  });

  it('builds safe OAuth success and failure redirect URLs', () => {
    expect(service.getOAuthRedirectUrl('/roadmaps/generate?template=frontend')).toBe(
      'http://localhost:3000/roadmaps/generate?template=frontend',
    );
    expect(service.getOAuthRedirectUrl('https://evil.example/phish')).toBe(
      'http://localhost:3000/',
    );
    expect(service.getOAuthFailureRedirectUrl('/dashboard?tab=progress')).toBe(
      'http://localhost:3000/sign-in?error=oauth_failed&callbackUrl=%2Fdashboard%3Ftab%3Dprogress',
    );
    expect(service.getOAuthFailureRedirectUrl('/')).toBe(
      'http://localhost:3000/sign-in?error=oauth_failed',
    );
  });

  it('refreshes tokens for an existing session identity', async () => {
    const result = await service.refresh('user-1', 'learner@example.test');

    expect(result).toEqual(['access-token', 'refresh-token']);
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      {
        email: 'learner@example.test',
        jti: expect.any(String) as string,
        sub: 'user-1',
      },
      { expiresIn: '7d', secret: 'refresh-secret' },
    );
    expect(refreshTokenService.create).toHaveBeenCalledWith(
      'user-1',
      'refresh-token',
      expect.any(Date),
    );
  });

  it('logs out by revoking all refresh tokens for the user', async () => {
    await service.logout('user-1');

    expect(refreshTokenService.revokeAllByUser).toHaveBeenCalledWith('user-1');
  });

  describe('forgotPassword', () => {
    it('does not reveal whether the email exists', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(
        service.forgotPassword({ email: 'missing@example.com' }),
      ).resolves.toBeUndefined();

      expect(passwordResetTokenService.create).not.toHaveBeenCalled();
      expect(passwordResetDeliveryService.sendResetInstructions).not.toHaveBeenCalled();
    });

    it('issues and delivers reset instructions for an existing user', async () => {
      userService.findByEmail.mockResolvedValue(makeUser());
      passwordResetTokenService.create.mockResolvedValue('raw-reset-token');

      await service.forgotPassword({ email: 'learner@example.test' });

      expect(passwordResetTokenService.create).toHaveBeenCalledWith('user-1');
      expect(passwordResetDeliveryService.sendResetInstructions).toHaveBeenCalledWith(
        'learner@example.test',
        'raw-reset-token',
      );
    });

    it('does not reveal the email if the user disappears before token creation', async () => {
      userService.findByEmail.mockResolvedValue(makeUser());
      passwordResetTokenService.create.mockRejectedValue(new UserNotFoundException('user-1'));

      await expect(
        service.forgotPassword({ email: 'learner@example.test' }),
      ).resolves.toBeUndefined();

      expect(passwordResetDeliveryService.sendResetInstructions).not.toHaveBeenCalled();
    });

    it('does not reveal the email if reset delivery fails', async () => {
      userService.findByEmail.mockResolvedValue(makeUser());
      passwordResetTokenService.create.mockResolvedValue('raw-reset-token');
      passwordResetDeliveryService.sendResetInstructions.mockRejectedValue(
        new Error('delivery failed'),
      );

      await expect(
        service.forgotPassword({ email: 'learner@example.test' }),
      ).resolves.toBeUndefined();

      expect(passwordResetDeliveryService.sendResetInstructions).toHaveBeenCalledWith(
        'learner@example.test',
        'raw-reset-token',
      );
    });
  });

  describe('resetPassword', () => {
    it('hashes the new password, consumes the token, and revokes refresh tokens', async () => {
      passwordResetTokenService.consume.mockResolvedValue('user-1');

      await service.resetPassword({
        newPassword: 'N3wS3cur3P@ss',
        token: 'raw-reset-token',
      });

      expect(passwordResetTokenService.consume).toHaveBeenCalledWith(
        'raw-reset-token',
        expect.stringMatching(/^\$2[aby]\$/),
      );
      expect(refreshTokenService.revokeAllByUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('changePassword', () => {
    it('validates the current password, stores the new hash, and revokes refresh tokens', async () => {
      const passwordHash = await bcrypt.hash('CorrectHorseBattery1!', 10);
      userService.findById.mockResolvedValue(makeUser({ passwordHash }));

      await service.changePassword('user-1', {
        currentPassword: 'CorrectHorseBattery1!',
        newPassword: 'N3wS3cur3P@ss',
      });

      expect(userService.updatePasswordHash).toHaveBeenCalledWith(
        'user-1',
        expect.stringMatching(/^\$2[aby]\$/),
      );
      expect(refreshTokenService.revokeAllByUser).toHaveBeenCalledWith('user-1');
    });

    it('rejects an incorrect current password', async () => {
      const passwordHash = await bcrypt.hash('CorrectHorseBattery1!', 10);
      userService.findById.mockResolvedValue(makeUser({ passwordHash }));

      await expect(
        service.changePassword('user-1', {
          currentPassword: 'WrongPassword1!',
          newPassword: 'N3wS3cur3P@ss',
        }),
      ).rejects.toThrow(InvalidCredentialsException);

      expect(userService.updatePasswordHash).not.toHaveBeenCalled();
      expect(refreshTokenService.revokeAllByUser).not.toHaveBeenCalled();
    });
  });
});
