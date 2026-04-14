import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClientKnownRequestError } from '@repo/db/prisma/internal/prismaNamespace';
import { createHmac } from 'node:crypto';

import {
  InternalServerErrorException,
  RefreshTokenAlreadyExistsException,
  UserNotFoundException,
} from '@/common/exceptions/app.exceptions';

import { PrismaService } from '../prisma/prisma.service';

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
          token: tokenHash,
          expiresAt,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string[] | undefined;
          const field = target?.[0];

          if (field === 'token') {
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
        token: tokenHash,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async revokeByToken(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);

    return await this.prisma.refreshToken.deleteMany({
      where: { token: tokenHash },
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
