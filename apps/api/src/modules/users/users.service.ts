import { Injectable } from '@nestjs/common';
import { type OAuthProvider, Prisma } from '@repo/db/prisma/client';

import { EmailAlreadyExistsException } from '@/common/exceptions/app.exceptions';

import { PrismaService } from '../prisma/prisma.service';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

type OAuthAccountInput = {
  provider: OAuthProvider;
  providerAccountId: string;
  providerEmail: string;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(createUserDto: CreateUserDto) {
    try {
      return await this.prisma.user.create({
        data: {
          ...createUserDto,
          avatarUrl: createUserDto.avatarUrl ?? '',
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string[] | undefined;
          const field = target?.[0];

          if (field === 'email') {
            throw new EmailAlreadyExistsException(createUserDto.email);
          }
        }
      }
      throw error;
    }
  }

  async createWithOAuth(
    createUserDto: Omit<CreateUserDto, 'passwordHash'>,
    oauth: OAuthAccountInput,
  ) {
    try {
      return await this.prisma.user.create({
        data: {
          ...createUserDto,
          avatarUrl: createUserDto.avatarUrl ?? '',
          passwordHash: null,
          oauthAccounts: {
            create: {
              provider: oauth.provider,
              providerAccountId: oauth.providerAccountId,
              providerEmail: oauth.providerEmail,
            },
          },
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error, 'email')) {
        throw new EmailAlreadyExistsException(createUserDto.email);
      }

      throw error;
    }
  }

  async findByOAuthAccount(oauth: Pick<OAuthAccountInput, 'provider' | 'providerAccountId'>) {
    const oauthAccount = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: oauth.provider,
          providerAccountId: oauth.providerAccountId,
        },
      },
      include: { user: true },
    });

    return oauthAccount?.user ?? null;
  }

  async linkOAuthAccount(userId: string, oauth: OAuthAccountInput) {
    try {
      await this.prisma.oAuthAccount.create({
        data: {
          provider: oauth.provider,
          providerAccountId: oauth.providerAccountId,
          providerEmail: oauth.providerEmail,
          userId,
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error, 'provider', 'providerAccountId')) {
        return await this.findByOAuthAccount(oauth);
      }

      throw error;
    }

    return await this.findById(userId);
  }

  async updateProfile(
    id: string,
    updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<CreateUserProfileDto> {
    return await this.prisma.user.update({
      where: { id },
      data: { ...updateUserProfileDto },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });
  }

  private isUniqueConstraintError(error: unknown, ...fields: string[]) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
      return false;
    }

    const target = error.meta?.target as string[] | undefined;

    return fields.every((field) => target?.includes(field));
  }
}
