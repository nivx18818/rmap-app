import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RefreshTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async saveRefreshToken(userId: string, refreshToken: string, expiresAt: Date) {
    return this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt,
      },
    });
  }

  async findTokenValid(token: string) {
    return this.prisma.refreshToken.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async revokeToken(token: string) {
    return this.prisma.refreshToken.deleteMany({
      where: { token },
    });
  }

  async revokeTokensForUser(userId: string) {
    return this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }
}
