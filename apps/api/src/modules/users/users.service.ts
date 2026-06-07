import { Injectable } from '@nestjs/common';
import { OAuthProvider, Prisma } from '@repo/db/prisma/client';

import {
  EmailAlreadyExistsException,
  OAuthAccountAlreadyConnectedException,
  OAuthDisconnectLastSignInMethodException,
  OAuthIntegrationNotConnectedException,
  OAuthProviderAlreadyConnectedException,
  UserNotFoundException,
} from '@/common/exceptions/app.exceptions';

import { PrismaService } from '../prisma/prisma.service';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

type OAuthAccountInput = {
  provider: OAuthProvider;
  providerAccountId: string;
  providerEmail: string;
};

const INTEGRATION_PROVIDERS = [OAuthProvider.GITHUB, OAuthProvider.GOOGLE] as const;

export type UserIntegration = {
  canDisconnect: boolean;
  connected: boolean;
  connectedAt: Date | null;
  provider: OAuthProvider;
  providerEmail: null | string;
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
      return await this.prisma.user.create({ data: { ...createUserDto } });
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
    const existingProviderAccount = await this.prisma.oAuthAccount.findFirst({
      where: {
        provider: oauth.provider,
        userId,
      },
    });

    if (existingProviderAccount) {
      if (existingProviderAccount.providerAccountId === oauth.providerAccountId) {
        return await this.findById(userId);
      }

      throw new OAuthProviderAlreadyConnectedException(oauth.provider);
    }

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
        const existingUser = await this.findByOAuthAccount(oauth);
        if (existingUser?.id === userId) {
          return existingUser;
        }

        throw new OAuthAccountAlreadyConnectedException(oauth.provider);
      }

      throw error;
    }

    return await this.findById(userId);
  }

  async listIntegrations(userId: string): Promise<UserIntegration[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        passwordHash: true,
        oauthAccounts: {
          select: {
            createdAt: true,
            provider: true,
            providerEmail: true,
          },
        },
      },
    });

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    const connectedCount = user.oauthAccounts.length;
    const hasPassword = !!user.passwordHash;

    return INTEGRATION_PROVIDERS.map((provider) => {
      const account = user.oauthAccounts.find((oauthAccount) => oauthAccount.provider === provider);
      const connected = !!account;

      return {
        canDisconnect: connected && (hasPassword || connectedCount > 1),
        connected,
        connectedAt: account?.createdAt ?? null,
        provider,
        providerEmail: account?.providerEmail ?? null,
      };
    });
  }

  async disconnectOAuthAccount(userId: string, provider: OAuthProvider): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        passwordHash: true,
        oauthAccounts: {
          select: {
            id: true,
            provider: true,
          },
        },
      },
    });

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    const account = user.oauthAccounts.find((oauthAccount) => oauthAccount.provider === provider);
    if (!account) {
      throw new OAuthIntegrationNotConnectedException(provider);
    }

    if (!user.passwordHash && user.oauthAccounts.length <= 1) {
      throw new OAuthDisconnectLastSignInMethodException();
    }

    await this.prisma.oAuthAccount.delete({
      where: { id: account.id },
    });
  }

  async updateProfile(
    id: string,
    updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<CreateUserProfileDto> {
    return await this.prisma.user.update({
      where: { id },
      data: { ...updateUserProfileDto },
      select: {
        avatarUrl: true,
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
      select: { id: true },
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
