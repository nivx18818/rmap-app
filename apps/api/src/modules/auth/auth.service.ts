import type { StringValue } from 'ms';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuthProvider } from '@repo/db/prisma/client';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { randomUUID } from 'node:crypto';

import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  UserNotFoundException,
} from '@/common/exceptions/app.exceptions';
import { buildDefaultAvatarUrl } from '@/common/utils/avatar-url.util';

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
    const avatarUrl = providedAvatarUrl ?? buildDefaultAvatarUrl();

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
          avatarUrl: profile.avatarUrl || buildDefaultAvatarUrl(),
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

  async loginWithGoogleMobile(idToken: string): Promise<[string, string]> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const client = new OAuth2Client(clientId);

    let oauthProfile: OAuthProfile;
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new InvalidCredentialsException();
      }

      oauthProfile = {
        email: payload.email ?? '',
        emailVerified: payload.email_verified === true,
        avatarUrl: payload.picture ?? '',
        fullName: payload.name ?? payload.email ?? '',
        provider: OAuthProvider.GOOGLE,
        providerAccountId: payload.sub,
      };
    } catch (error) {
      console.error('Verify Token Error:', error);
      throw new InvalidCredentialsException();
    }

    return await this.loginWithOAuth(oauthProfile);
  }

  async loginWithGithubMobile(code: string): Promise<[string, string]> {
    const clientId = this.configService.get<string>('GITHUB_MOBILE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GITHUB_MOBILE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      console.error(
        'Missing GITHUB_MOBILE_CLIENT_ID or GITHUB_MOBILE_CLIENT_SECRET in backend config',
      );
      throw new InvalidCredentialsException();
    }

    try {
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: 'rmap://oauth/callback',
        }),
      });

      if (!tokenResponse.ok) {
        throw new InvalidCredentialsException();
      }

      const tokenData = (await tokenResponse.json()) as { access_token?: string };
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        console.error('GitHub token exchange failed. Response:', tokenData);
        throw new InvalidCredentialsException();
      }

      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userResponse.ok) {
        throw new InvalidCredentialsException();
      }

      const profile = await userResponse.json();

      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      let email: string | null = null;
      let emailVerified = false;

      if (emailsResponse.ok) {
        const emails = (await emailsResponse.json()) as any[];
        const primaryVerifiedEmail = emails.find((e: any) => e.primary && e.verified);
        const firstVerifiedEmail = emails.find((e: any) => e.verified);

        email = primaryVerifiedEmail?.email ?? firstVerifiedEmail?.email ?? null;
        emailVerified = !!email;
      }

      if (!email) {
        throw new InvalidCredentialsException();
      }

      const oauthProfile: OAuthProfile = {
        email,
        emailVerified,
        avatarUrl: profile.avatar_url ?? profile.photos?.[0]?.value ?? '',
        fullName: profile.name || profile.login || email || `github-${profile.id}`,
        provider: OAuthProvider.GITHUB,
        providerAccountId: profile.id.toString(),
      };

      return await this.loginWithOAuth(oauthProfile);
    } catch (error) {
      console.error('GitHub Mobile Login Error:', error);
      throw new InvalidCredentialsException();
    }
  }

  async linkOAuthAccountFromAccessToken(
    accessToken: string,
    profile: OAuthProfile,
  ): Promise<boolean> {
    if (!profile.email || !profile.emailVerified) {
      throw new InvalidCredentialsException();
    }

    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      return false;
    }

    let payload: { email: string; sub: string };
    try {
      payload = await this.jwtService.verifyAsync<{ email: string; sub: string }>(accessToken, {
        secret,
      });
    } catch {
      return false;
    }

    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UserNotFoundException(payload.sub);
    }

    await this.userService.linkOAuthAccount(user.id, {
      provider: profile.provider,
      providerAccountId: profile.providerAccountId,
      providerEmail: profile.email,
    });

    return true;
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

  getOAuthCallbackRedirectUrl(callbackUrl: unknown, params: Record<string, string>) {
    const clientUrl = this.getClientUrl();
    const callbackPath = normalizeOAuthCallbackPath(callbackUrl, this.getOAuthCallbackUrlBase());
    const callbackRedirectUrl = new URL(callbackPath, clientUrl);

    for (const [key, value] of Object.entries(params)) {
      callbackRedirectUrl.searchParams.set(key, value);
    }

    return callbackRedirectUrl.toString();
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
