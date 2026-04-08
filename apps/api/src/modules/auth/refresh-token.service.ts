import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RefreshTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async saveRefreshToken(userId: string, refreshToken: string, expiresAt: Date) {
    try {
      const result = await this.prisma.refreshToken.create({
        data: {
          userId,
          token: refreshToken,
          expiresAt,
        },
      });
      return result;
    } catch (error) {
      console.error('Error saving refresh token:', error);
      throw new Error('Cannot save refresh token');
    }
  }

  async findTokenValid(token: string) {
    try {
      const result = this.prisma.refreshToken.findFirst({
        where: {
          token,
          expiresAt: { gt: new Date() },
        },
      });
      return result;
    } catch (error) {
      console.error('Error finding refresh token:', error);
      throw new Error('Cannot find refresh token');
    }
  }

  async revokeToken(token: string) {
    try {
      const result = this.prisma.refreshToken.deleteMany({
        where: { token },
      });
      return result;
    } catch (error) {
      console.error('Error revoking refresh token:', error);
      throw new Error('Cannot revoke refresh token');
    }
  }

  async revokeTokensForUser(userId: string) {
    try {
      const result = this.prisma.refreshToken.deleteMany({
        where: { userId },
      });
      return result;
    } catch (error) {
      console.error('Error revoking refresh tokens for user:', error);
      throw new Error('Cannot revoke refresh tokens for user');
    }
  }
}
