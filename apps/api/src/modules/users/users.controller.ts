import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common';
import { OAuthProvider } from '@repo/db/prisma/client';

import { UnsupportedOAuthProviderException } from '@/common/exceptions/app.exceptions';
import { resolveAvatarUrl } from '@/common/utils/avatar-url.util';

import { CurrentUser, type RequestUser } from '../auth/decorators/current-user.decorator';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { type UserIntegration, UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: RequestUser): CreateUserProfileDto {
    return this.formatCreateUserProfile(user);
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: RequestUser,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<CreateUserProfileDto> {
    const updatedUser = await this.userService.updateProfile(user.id, updateUserProfileDto);
    return this.formatCreateUserProfile(updatedUser);
  }

  @Get('me/integrations')
  async getIntegrations(@CurrentUser() user: RequestUser): Promise<UserIntegration[]> {
    return await this.userService.listIntegrations(user.id);
  }

  @Delete('me/integrations/:provider')
  @HttpCode(HttpStatus.NO_CONTENT)
  async disconnectIntegration(
    @CurrentUser() user: RequestUser,
    @Param('provider') providerParam: string,
  ): Promise<void> {
    await this.userService.disconnectOAuthAccount(user.id, this.parseOAuthProvider(providerParam));
  }

  private formatCreateUserProfile(user: CreateUserProfileDto | RequestUser): CreateUserProfileDto {
    return {
      avatarUrl: resolveAvatarUrl(user),
      createdAt: user.createdAt,
      email: user.email,
      fullName: user.fullName,
      id: user.id,
      role: user.role.toLowerCase(),
    };
  }

  private parseOAuthProvider(value: string): OAuthProvider {
    const provider = value.toUpperCase();
    if (!Object.values(OAuthProvider).includes(provider as OAuthProvider)) {
      throw new UnsupportedOAuthProviderException();
    }

    return provider as OAuthProvider;
  }
}
