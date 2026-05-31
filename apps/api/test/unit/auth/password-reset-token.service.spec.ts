import type { TestingModule } from '@nestjs/testing';

import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { InvalidPasswordResetTokenException } from '@/common/exceptions/app.exceptions';
import { PasswordResetTokenService } from '@/modules/auth/password-reset-token.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

type AsyncMock<TResult = unknown, TArgs extends unknown[] = unknown[]> = jest.Mock<
  Promise<TResult>,
  TArgs
>;

interface PasswordResetTokenRecord {
  expiresAt: Date;
  id: string;
  usedAt: Date | null;
  userId: string;
}

interface PasswordResetTokenPrismaMock {
  $transaction: AsyncMock<unknown, [unknown]>;
  passwordResetToken: {
    create: AsyncMock<Record<string, unknown>>;
    updateMany: AsyncMock<{ count: number }>;
  };
}

interface PasswordResetTokenTransactionMock {
  passwordResetToken: {
    findUnique: AsyncMock<PasswordResetTokenRecord | null>;
    updateMany: AsyncMock<{ count: number }>;
  };
  user: {
    update: AsyncMock<Record<string, unknown>>;
  };
}

type TransactionCallback = (tx: PasswordResetTokenTransactionMock) => unknown;

const SYSTEM_NOW = new Date('2026-05-30T08:00:00Z');
const expectAnyString = (): string => expect.any(String) as string;

const createPrismaMock = (
  txMock: PasswordResetTokenTransactionMock,
): PasswordResetTokenPrismaMock => ({
  $transaction: jest.fn<Promise<unknown>, [unknown]>().mockImplementation(async (input) => {
    if (Array.isArray(input)) {
      return Promise.all(input as Array<Promise<unknown>>);
    }

    return (input as TransactionCallback)(txMock);
  }),
  passwordResetToken: {
    create: jest.fn<Promise<Record<string, unknown>>, unknown[]>().mockResolvedValue({}),
    updateMany: jest.fn<Promise<{ count: number }>, unknown[]>().mockResolvedValue({ count: 0 }),
  },
});

const createTransactionMock = (): PasswordResetTokenTransactionMock => ({
  passwordResetToken: {
    findUnique: jest.fn<Promise<PasswordResetTokenRecord | null>, unknown[]>(),
    updateMany: jest.fn<Promise<{ count: number }>, unknown[]>().mockResolvedValue({ count: 1 }),
  },
  user: {
    update: jest.fn<Promise<Record<string, unknown>>, unknown[]>().mockResolvedValue({}),
  },
});

describe('PasswordResetTokenService', () => {
  let service: PasswordResetTokenService;
  let prisma: PasswordResetTokenPrismaMock;
  let txMock: PasswordResetTokenTransactionMock;

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(SYSTEM_NOW);

    txMock = createTransactionMock();
    prisma = createPrismaMock(txMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetTokenService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'PASSWORD_RESET_TOKEN_HASH_SECRET') {
                return 'test-reset-secret';
              }

              if (key === 'PASSWORD_RESET_TOKEN_TTL_MINUTES') {
                return '15';
              }

              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PasswordResetTokenService>(PasswordResetTokenService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should create a reset token and persist only its hash', async () => {
    const resetToken = await service.create('user-1');

    expect(resetToken).toEqual(expect.any(String));
    expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        usedAt: null,
        expiresAt: { gt: SYSTEM_NOW },
      },
      data: { usedAt: SYSTEM_NOW },
    });
    expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        tokenHash: expectAnyString(),
        expiresAt: new Date('2026-05-30T08:15:00Z'),
      },
    });

    const createArgs = prisma.passwordResetToken.create.mock.calls[0]?.[0] as {
      data: { tokenHash: string };
    };
    expect(createArgs.data.tokenHash).not.toBe(resetToken);
    expect(createArgs.data.tokenHash).toHaveLength(64);
  });

  it('should consume a valid token, update the password hash, and return the user id', async () => {
    txMock.passwordResetToken.findUnique.mockResolvedValue({
      expiresAt: new Date('2026-05-30T08:10:00Z'),
      id: 'reset-token-1',
      usedAt: null,
      userId: 'user-1',
    });

    const result = await service.consume('raw-reset-token', 'new-password-hash');

    expect(result).toBe('user-1');
    expect(txMock.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'reset-token-1',
        usedAt: null,
        expiresAt: { gt: SYSTEM_NOW },
      },
      data: { usedAt: SYSTEM_NOW },
    });
    expect(txMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { passwordHash: 'new-password-hash' },
    });
  });

  it('should reject an invalid token', async () => {
    txMock.passwordResetToken.findUnique.mockResolvedValue(null);

    await expect(service.consume('invalid-token', 'new-password-hash')).rejects.toThrow(
      InvalidPasswordResetTokenException,
    );
    expect(txMock.passwordResetToken.updateMany).not.toHaveBeenCalled();
    expect(txMock.user.update).not.toHaveBeenCalled();
  });

  it('should reject an expired token', async () => {
    txMock.passwordResetToken.findUnique.mockResolvedValue({
      expiresAt: new Date('2026-05-30T07:59:59Z'),
      id: 'reset-token-1',
      usedAt: null,
      userId: 'user-1',
    });

    await expect(service.consume('expired-token', 'new-password-hash')).rejects.toThrow(
      InvalidPasswordResetTokenException,
    );
    expect(txMock.passwordResetToken.updateMany).not.toHaveBeenCalled();
    expect(txMock.user.update).not.toHaveBeenCalled();
  });

  it('should reject a used token', async () => {
    txMock.passwordResetToken.findUnique.mockResolvedValue({
      expiresAt: new Date('2026-05-30T08:10:00Z'),
      id: 'reset-token-1',
      usedAt: new Date('2026-05-30T08:01:00Z'),
      userId: 'user-1',
    });

    await expect(service.consume('used-token', 'new-password-hash')).rejects.toThrow(
      InvalidPasswordResetTokenException,
    );
    expect(txMock.passwordResetToken.updateMany).not.toHaveBeenCalled();
    expect(txMock.user.update).not.toHaveBeenCalled();
  });

  it('should reject a token that was consumed concurrently', async () => {
    txMock.passwordResetToken.findUnique.mockResolvedValue({
      expiresAt: new Date('2026-05-30T08:10:00Z'),
      id: 'reset-token-1',
      usedAt: null,
      userId: 'user-1',
    });
    txMock.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.consume('raced-token', 'new-password-hash')).rejects.toThrow(
      InvalidPasswordResetTokenException,
    );
    expect(txMock.user.update).not.toHaveBeenCalled();
  });
});
