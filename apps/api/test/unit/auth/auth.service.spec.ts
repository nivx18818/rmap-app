import type { TestingModule } from '@nestjs/testing';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';

import { UserNotFoundException } from '@/common/exceptions/app.exceptions';
import { AuthService } from '@/modules/auth/auth.service';
import { PasswordResetDeliveryService } from '@/modules/auth/password-reset-delivery.service';
import { PasswordResetTokenService } from '@/modules/auth/password-reset-token.service';
import { RefreshTokenService } from '@/modules/auth/refresh-token.service';
import { UserService } from '@/modules/user/user.service';

interface AuthUserRecord {
  email: string;
  fullName: string;
  id: string;
  passwordHash: string;
}

type AsyncMock<TResult = unknown, TArgs extends unknown[] = unknown[]> = jest.Mock<
  Promise<TResult>,
  TArgs
>;

interface UserServiceMock {
  create: AsyncMock<AuthUserRecord>;
  findByEmail: AsyncMock<AuthUserRecord | null>;
}

interface PasswordResetTokenServiceMock {
  consume: AsyncMock<string>;
  create: AsyncMock<string>;
}

interface PasswordResetDeliveryServiceMock {
  sendResetInstructions: AsyncMock<void, [string, string]>;
}

interface RefreshTokenServiceMock {
  create: AsyncMock<Record<string, unknown>>;
  revokeAllByUser: AsyncMock<Record<string, unknown>>;
}

const createUserRecord = (overrides: Partial<AuthUserRecord> = {}): AuthUserRecord => ({
  email: 'jane@example.com',
  fullName: 'Jane Doe',
  id: 'user-1',
  passwordHash: 'old-password-hash',
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserServiceMock;
  let passwordResetTokenService: PasswordResetTokenServiceMock;
  let passwordResetDeliveryService: PasswordResetDeliveryServiceMock;
  let refreshTokenService: RefreshTokenServiceMock;

  beforeEach(async () => {
    userService = {
      create: jest.fn<Promise<AuthUserRecord>, unknown[]>(),
      findByEmail: jest.fn<Promise<AuthUserRecord | null>, unknown[]>(),
    };
    passwordResetTokenService = {
      consume: jest.fn<Promise<string>, unknown[]>(),
      create: jest.fn<Promise<string>, unknown[]>(),
    };
    passwordResetDeliveryService = {
      sendResetInstructions: jest.fn<Promise<void>, [string, string]>().mockResolvedValue(),
    };
    refreshTokenService = {
      create: jest.fn<Promise<Record<string, unknown>>, unknown[]>().mockResolvedValue({}),
      revokeAllByUser: jest.fn<Promise<Record<string, unknown>>, unknown[]>().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: userService,
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn<Promise<string>, unknown[]>().mockResolvedValue('signed-token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: RefreshTokenService,
          useValue: refreshTokenService,
        },
        {
          provide: PasswordResetTokenService,
          useValue: passwordResetTokenService,
        },
        {
          provide: PasswordResetDeliveryService,
          useValue: passwordResetDeliveryService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('forgotPassword', () => {
    it('should not reveal whether the email exists', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(
        service.forgotPassword({ email: 'missing@example.com' }),
      ).resolves.toBeUndefined();

      expect(passwordResetTokenService.create).not.toHaveBeenCalled();
      expect(passwordResetDeliveryService.sendResetInstructions).not.toHaveBeenCalled();
    });

    it('should issue and deliver reset instructions for an existing user', async () => {
      userService.findByEmail.mockResolvedValue(createUserRecord());
      passwordResetTokenService.create.mockResolvedValue('raw-reset-token');

      await service.forgotPassword({ email: 'jane@example.com' });

      expect(passwordResetTokenService.create).toHaveBeenCalledWith('user-1');
      expect(passwordResetDeliveryService.sendResetInstructions).toHaveBeenCalledWith(
        'jane@example.com',
        'raw-reset-token',
      );
    });

    it('should still not reveal the email if the user disappears before token creation', async () => {
      userService.findByEmail.mockResolvedValue(createUserRecord());
      passwordResetTokenService.create.mockRejectedValue(new UserNotFoundException('user-1'));

      await expect(service.forgotPassword({ email: 'jane@example.com' })).resolves.toBeUndefined();

      expect(passwordResetDeliveryService.sendResetInstructions).not.toHaveBeenCalled();
    });

    it('should not reveal the email if reset delivery fails', async () => {
      userService.findByEmail.mockResolvedValue(createUserRecord());
      passwordResetTokenService.create.mockResolvedValue('raw-reset-token');
      passwordResetDeliveryService.sendResetInstructions.mockRejectedValue(
        new Error('delivery failed'),
      );

      await expect(service.forgotPassword({ email: 'jane@example.com' })).resolves.toBeUndefined();

      expect(passwordResetDeliveryService.sendResetInstructions).toHaveBeenCalledWith(
        'jane@example.com',
        'raw-reset-token',
      );
    });
  });

  describe('resetPassword', () => {
    it('should hash the new password, consume the token, and revoke refresh tokens', async () => {
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
});
