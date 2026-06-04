import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@repo/db/prisma/client';
import { createHmac } from 'node:crypto';

import {
  InternalServerErrorException,
  RefreshTokenAlreadyExistsException,
  UserNotFoundException,
} from '@/common/exceptions/app.exceptions';

import { PrismaService } from '../prisma/prisma.service';

export const REFRESH_TOKEN_ROTATION_GRACE_SECONDS = 10;

@Injectable()
export class RefreshTokenService {
  private readonly refreshTokenHashSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const secret =
      configService.get<string>('JWT_REFRESH_TOKEN_HASH_SECRET') ??
      configService.get<string>('JWT_REFRESH_SECRET');

    if (!secret) {
      throw new InternalServerErrorException('JWT_REFRESH_TOKEN_HASH_SECRET is not defined');
    }

    this.refreshTokenHashSecret = secret;
  }

  async create(userId: string, refreshToken: string, expiresAt: Date) {
    const tokenHash = this.hashToken(refreshToken);

    try {
      return await this.prisma.refreshToken.create({
        data: {
          userId,
          tokenHash,
          expiresAt,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target;

          if (
            Array.isArray(target) &&
            target.some((field) => ['token', 'tokenHash', 'token_hash'].includes(String(field)))
          ) {
            throw new RefreshTokenAlreadyExistsException();
          }
        }

        if (error.code === 'P2003') {
          throw new UserNotFoundException(userId);
        }
      }

      throw error;
    }
  }

  async findValid(userId: string, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);

    return await this.prisma.refreshToken.findFirst({
      where: {
        userId,
        tokenHash,
        expiresAt: { gt: new Date() },
        rotatedAt: null,
      },
    });
  }

  async findValidForRefresh(userId: string, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const now = new Date();
    const rotationGraceStartedAt = new Date(
      now.getTime() - REFRESH_TOKEN_ROTATION_GRACE_SECONDS * 1000,
    );

    return await this.prisma.refreshToken.findFirst({
      where: {
        userId,
        tokenHash,
        expiresAt: { gt: now },
        OR: [{ rotatedAt: null }, { rotatedAt: { gte: rotationGraceStartedAt } }],
      },
    });
  }

  async markRotatedByToken(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);

    return await this.prisma.refreshToken.updateMany({
      data: { rotatedAt: new Date() },
      where: { rotatedAt: null, tokenHash },
    });
  }

  async revokeByToken(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);

    return await this.prisma.refreshToken.deleteMany({
      where: { tokenHash },
    });
  }

  async revokeAllByUser(userId: string) {
    return await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  private hashToken(token: string) {
    return createHmac('sha256', this.refreshTokenHashSecret).update(token).digest('hex');
  }
}
