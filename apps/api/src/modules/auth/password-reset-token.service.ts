import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@repo/db/prisma/client';
import { createHmac, randomBytes } from 'node:crypto';

import {
  InternalServerErrorException,
  InvalidPasswordResetTokenException,
  UserNotFoundException,
} from '@/common/exceptions/app.exceptions';

import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_RESET_TOKEN_TTL_MINUTES = 15;

@Injectable()
export class PasswordResetTokenService {
  private readonly passwordResetTokenHashSecret: string;
  private readonly passwordResetTokenTtlMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const secret =
      configService.get<string>('PASSWORD_RESET_TOKEN_HASH_SECRET') ??
      configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new InternalServerErrorException('PASSWORD_RESET_TOKEN_HASH_SECRET is not defined');
    }

    this.passwordResetTokenHashSecret = secret;
    this.passwordResetTokenTtlMs = this.getTtlMs();
  }

  async create(userId: string) {
    const resetToken = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(resetToken);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.passwordResetTokenTtlMs);

    try {
      await this.prisma.$transaction([
        this.prisma.passwordResetToken.updateMany({
          where: {
            userId,
            usedAt: null,
            expiresAt: { gt: now },
          },
          data: { usedAt: now },
        }),
        this.prisma.passwordResetToken.create({
          data: {
            userId,
            tokenHash,
            expiresAt,
          },
        }),
      ]);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new UserNotFoundException(userId);
      }

      throw error;
    }

    return resetToken;
  }

  async consume(resetToken: string, passwordHash: string) {
    const tokenHash = this.hashToken(resetToken);

    return await this.prisma.$transaction(async (tx) => {
      const tokenRecord = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
        select: {
          expiresAt: true,
          id: true,
          usedAt: true,
          userId: true,
        },
      });

      const now = new Date();

      if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt <= now) {
        throw new InvalidPasswordResetTokenException();
      }

      const consumed = await tx.passwordResetToken.updateMany({
        where: {
          id: tokenRecord.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
      });

      if (consumed.count !== 1) {
        throw new InvalidPasswordResetTokenException();
      }

      await tx.user.update({
        where: { id: tokenRecord.userId },
        data: { passwordHash },
      });

      return tokenRecord.userId;
    });
  }

  private getTtlMs() {
    const configuredTtlMinutes = this.configService.get<string>('PASSWORD_RESET_TOKEN_TTL_MINUTES');
    const ttlMinutes = configuredTtlMinutes
      ? Number(configuredTtlMinutes)
      : DEFAULT_RESET_TOKEN_TTL_MINUTES;

    if (!Number.isFinite(ttlMinutes) || ttlMinutes <= 0) {
      return DEFAULT_RESET_TOKEN_TTL_MINUTES * 60 * 1000;
    }

    return ttlMinutes * 60 * 1000;
  }

  private hashToken(token: string) {
    return createHmac('sha256', this.passwordResetTokenHashSecret).update(token).digest('hex');
  }
}
