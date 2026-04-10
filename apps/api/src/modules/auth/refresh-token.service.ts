import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@repo/db/prisma/internal/prismaNamespace';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RefreshTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async saveRefreshToken(userId: string, refreshToken: string, expiresAt: Date) {
    try {
      return await this.prisma.refreshToken.create({
        data: {
          userId,
          token: refreshToken,
          expiresAt,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string[] | undefined;
          const field = target?.[0];

          if (field === 'token') {
            throw new ConflictException('Refresh token already exists');
          }
        }

        if (error.code === 'P2003') {
          throw new BadRequestException('Invalid user for refresh token');
        }
      }

      throw error;
    }
  }

  async findTokenValid(token: string) {
    return await this.prisma.refreshToken.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async revokeToken(token: string) {
    return await this.prisma.refreshToken.deleteMany({
      where: { token },
    });
  }

  async revokeTokensForUser(userId: string) {
    return await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }
}
