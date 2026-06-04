import type { TestingModule } from '@nestjs/testing';

import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Prisma } from '@repo/db/prisma/client';
import { createHmac } from 'node:crypto';

import {
  InternalServerErrorException,
  RefreshTokenAlreadyExistsException,
  UserNotFoundException,
} from '@/common/exceptions/app.exceptions';
import { RefreshTokenService } from '@/modules/auth/refresh-token.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

const hashToken = (token: string) =>
  createHmac('sha256', 'hash-secret').update(token).digest('hex');

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  const prisma = {
    refreshToken: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const configService = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        JWT_REFRESH_SECRET: 'refresh-secret',
        JWT_REFRESH_TOKEN_HASH_SECRET: 'hash-secret',
      };

      return values[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(RefreshTokenService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('stores only the HMAC hash of the refresh token', async () => {
    const expiresAt = new Date('2026-06-01T00:00:00.000Z');
    prisma.refreshToken.create.mockResolvedValue({
      createdAt: new Date('2026-05-01T00:00:00.000Z'),
      expiresAt,
      id: 'refresh-1',
      tokenHash: hashToken('refresh-token'),
      userId: 'user-1',
    });

    await service.create('user-1', 'refresh-token', expiresAt);

    expect(prisma.refreshToken.create).toHaveBeenCalledWith({
      data: {
        expiresAt,
        tokenHash: hashToken('refresh-token'),
        userId: 'user-1',
      },
    });
  });

  it('falls back to JWT_REFRESH_SECRET when a dedicated hash secret is not configured', async () => {
    const fallbackConfig = {
      get: jest.fn((key: string) => ({ JWT_REFRESH_SECRET: 'fallback' })[key]),
    };
    const fallbackService = new RefreshTokenService(
      prisma as unknown as PrismaService,
      fallbackConfig as unknown as ConfigService,
    );

    prisma.refreshToken.findFirst.mockResolvedValue(null);
    await fallbackService.findValid('user-1', 'refresh-token');

    expect(prisma.refreshToken.findFirst).toHaveBeenCalledWith({
      where: {
        expiresAt: { gt: expect.any(Date) as Date },
        rotatedAt: null,
        tokenHash: createHmac('sha256', 'fallback').update('refresh-token').digest('hex'),
        userId: 'user-1',
      },
    });
  });

  it('requires a refresh-token hash secret', () => {
    const emptyConfig = { get: jest.fn() };

    expect(
      () =>
        new RefreshTokenService(
          prisma as unknown as PrismaService,
          emptyConfig as unknown as ConfigService,
        ),
    ).toThrow(InternalServerErrorException);
  });

  it('maps refresh token uniqueness and user foreign-key errors to app exceptions', async () => {
    prisma.refreshToken.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique failed', {
        clientVersion: '1.0',
        code: 'P2002',
        meta: { target: ['tokenHash'] },
      }),
    );

    await expect(service.create('user-1', 'refresh-token', new Date())).rejects.toThrow(
      RefreshTokenAlreadyExistsException,
    );

    prisma.refreshToken.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Foreign key failed', {
        clientVersion: '1.0',
        code: 'P2003',
      }),
    );

    await expect(service.create('user-1', 'refresh-token', new Date())).rejects.toThrow(
      UserNotFoundException,
    );
  });

  it('finds active unrotated refresh-token records by hashed token and user id', async () => {
    await service.findValid('user-1', 'refresh-token');

    expect(prisma.refreshToken.findFirst).toHaveBeenCalledWith({
      where: {
        expiresAt: { gt: expect.any(Date) as Date },
        rotatedAt: null,
        tokenHash: hashToken('refresh-token'),
        userId: 'user-1',
      },
    });
  });

  it('returns an unrotated valid token for refresh', async () => {
    const now = new Date('2026-06-01T00:00:00.000Z');
    jest.useFakeTimers().setSystemTime(now);
    const storedToken = {
      createdAt: now,
      expiresAt: new Date('2026-06-08T00:00:00.000Z'),
      id: 'refresh-1',
      rotatedAt: null,
      tokenHash: hashToken('refresh-token'),
      userId: 'user-1',
    };
    prisma.refreshToken.findFirst.mockResolvedValue(storedToken);

    await expect(service.findValidForRefresh('user-1', 'refresh-token')).resolves.toEqual(
      storedToken,
    );

    expect(prisma.refreshToken.findFirst).toHaveBeenCalledWith({
      where: {
        expiresAt: { gt: now },
        OR: [{ rotatedAt: null }, { rotatedAt: { gte: new Date('2026-05-31T23:59:50.000Z') } }],
        tokenHash: hashToken('refresh-token'),
        userId: 'user-1',
      },
    });
  });

  it('returns a recently rotated token inside the refresh grace window', async () => {
    const now = new Date('2026-06-01T00:00:00.000Z');
    jest.useFakeTimers().setSystemTime(now);
    const storedToken = {
      createdAt: new Date('2026-05-01T00:00:00.000Z'),
      expiresAt: new Date('2026-06-08T00:00:00.000Z'),
      id: 'refresh-1',
      rotatedAt: new Date('2026-05-31T23:59:55.000Z'),
      tokenHash: hashToken('refresh-token'),
      userId: 'user-1',
    };
    prisma.refreshToken.findFirst.mockResolvedValue(storedToken);

    await expect(service.findValidForRefresh('user-1', 'refresh-token')).resolves.toEqual(
      storedToken,
    );

    expect(prisma.refreshToken.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        OR: [{ rotatedAt: null }, { rotatedAt: { gte: new Date('2026-05-31T23:59:50.000Z') } }],
      }) as object,
    });
  });

  it('rejects rotated tokens outside the refresh grace window', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-01T00:00:00.000Z'));
    prisma.refreshToken.findFirst.mockResolvedValue(null);

    await expect(service.findValidForRefresh('user-1', 'refresh-token')).resolves.toBeNull();

    expect(prisma.refreshToken.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        OR: [{ rotatedAt: null }, { rotatedAt: { gte: new Date('2026-05-31T23:59:50.000Z') } }],
      }) as object,
    });
  });

  it('rejects expired or unknown tokens for refresh', async () => {
    prisma.refreshToken.findFirst.mockResolvedValue(null);

    await expect(service.findValidForRefresh('user-1', 'missing-token')).resolves.toBeNull();

    expect(prisma.refreshToken.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        expiresAt: { gt: expect.any(Date) as Date },
        tokenHash: hashToken('missing-token'),
        userId: 'user-1',
      }) as object,
    });
  });

  it('marks a presented refresh token as rotated without deleting it', async () => {
    await service.markRotatedByToken('refresh-token');

    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      data: { rotatedAt: expect.any(Date) as Date },
      where: { rotatedAt: null, tokenHash: hashToken('refresh-token') },
    });
    expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
  });

  it('revokes one or all refresh-token records by hashed token or user id', async () => {
    await service.revokeByToken('refresh-token');
    await service.revokeAllByUser('user-1');

    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { tokenHash: hashToken('refresh-token') },
    });
    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
  });
});
