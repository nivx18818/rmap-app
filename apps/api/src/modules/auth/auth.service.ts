import type { StringValue } from 'ms';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';

import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  UserNotFoundException,
} from '@/common/exceptions/app.exceptions';

import type { ChangePasswordDto } from './dto/change-password.dto';
import type { ForgotPasswordDto } from './dto/forgot-password.dto';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { ResetPasswordDto } from './dto/reset-password.dto';
import type { OAuthProfile } from './types/oauth-profile.type';

import { UsersService } from '../users/users.service';
import { PasswordResetDeliveryService } from './password-reset-delivery.service';
import { PasswordResetTokenService } from './password-reset-token.service';
import { RefreshTokenService } from './refresh-token.service';
import { normalizeOAuthCallbackPath } from './utils/oauth-callback';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly passwordResetTokenService: PasswordResetTokenService,
    private readonly passwordResetDeliveryService: PasswordResetDeliveryService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, fullName, avatarUrl: providedAvatarUrl } = registerDto;

    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new EmailAlreadyExistsException(email);
    }

    const passwordHash = await this.hashPassword(password);
    const avatarUrl =
      providedAvatarUrl ??
      `https://api.dicebear.com/10.x/adventurer/svg?seed=${encodeURIComponent(
        fullName.trim() || email.trim(),
      )}`;

    const user = await this.userService.create({
      email,
      passwordHash,
      fullName,
      avatarUrl,
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto): Promise<[string, string]> {
    const { email, password } = loginDto;

    const user = await this.userService.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw new InvalidCredentialsException();
    }

    if (!user.passwordHash) {
      throw new InvalidCredentialsException();
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    const payload = { sub: user.id, email: user.email };
    const tokens = await this.issueTokens(payload);
    return tokens;
  }

  async loginWithOAuth(profile: OAuthProfile): Promise<[string, string]> {
    if (!profile.email || !profile.emailVerified) {
      throw new InvalidCredentialsException();
    }

    const oauthAccountInput = {
      provider: profile.provider,
      providerAccountId: profile.providerAccountId,
      providerEmail: profile.email,
    };
    const existingOAuthUser = await this.userService.findByOAuthAccount(oauthAccountInput);

    if (existingOAuthUser) {
      return await this.issueTokens({
        email: existingOAuthUser.email,
        sub: existingOAuthUser.id,
      });
    }

    const existingEmailUser = await this.userService.findByEmail(profile.email);
    let user =
      existingEmailUser ??
      (await this.userService.createWithOAuth(
        {
          email: profile.email,
          fullName: profile.fullName,
        },
        oauthAccountInput,
      ));

    if (existingEmailUser) {
      user =
        (await this.userService.linkOAuthAccount(existingEmailUser.id, oauthAccountInput)) ??
        existingEmailUser;
    }

    return await this.issueTokens({
      email: user.email,
      sub: user.id,
    });
  }

  async refresh(userId: string, email: string): Promise<[string, string]> {
    const payload = { sub: userId, email };
    const tokens = await this.issueTokens(payload);
    return tokens;
  }

  async logout(userId: string) {
    await this.refreshTokenService.revokeAllByUser(userId);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userService.findByEmail(forgotPasswordDto.email);

    if (!user) {
      return;
    }

    let resetToken: string;

    try {
      resetToken = await this.passwordResetTokenService.create(user.id);
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        return;
      }

      throw error;
    }

    try {
      await this.passwordResetDeliveryService.sendResetInstructions(user.email, resetToken);
    } catch {
      return;
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const passwordHash = await this.hashPassword(resetPasswordDto.newPassword);
    const userId = await this.passwordResetTokenService.consume(
      resetPasswordDto.token,
      passwordHash,
    );

    await this.refreshTokenService.revokeAllByUser(userId);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    if (!user.passwordHash) {
      throw new InvalidCredentialsException();
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new InvalidCredentialsException();
    }

    const passwordHash = await this.hashPassword(changePasswordDto.newPassword);
    await this.userService.updatePasswordHash(userId, passwordHash);
    await this.refreshTokenService.revokeAllByUser(userId);
  }

  getOAuthRedirectUrl(callbackUrl: unknown) {
    const clientUrl = this.getClientUrl();
    const callbackPath = normalizeOAuthCallbackPath(callbackUrl, this.getOAuthCallbackUrlBase());

    return new URL(callbackPath, clientUrl).toString();
  }

  getOAuthFailureRedirectUrl(callbackUrl: unknown) {
    const clientUrl = this.getClientUrl();
    const callbackPath = normalizeOAuthCallbackPath(callbackUrl, this.getOAuthCallbackUrlBase());
    const signInUrl = new URL('/sign-in', clientUrl);

    signInUrl.searchParams.set('error', 'oauth_failed');
    if (callbackPath !== '/') {
      signInUrl.searchParams.set('callbackUrl', callbackPath);
    }

    return signInUrl.toString();
  }

  private async issueTokens(payload: { sub: string; email: string }): Promise<[string, string]> {
    const refreshPayload = { ...payload, jti: randomUUID() };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<StringValue>('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<StringValue>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.refreshTokenService.create(payload.sub, refreshToken, expiresAt);

    return [accessToken, refreshToken];
  }

  private getClientUrl(): string {
    return this.configService.get<string>('CLIENT_URL') ?? 'http://localhost:3000';
  }

  private getOAuthCallbackUrlBase(): string {
    return this.configService.get<string>('CALL_BACK_URL_BASE') ?? this.getClientUrl();
  }

  private async hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
  }
}
