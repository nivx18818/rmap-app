import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { OAuthProvider } from '@repo/db/prisma/client';
import { type Profile, Strategy } from 'passport-github2';

import type { OAuthProfile } from '../types/oauth-profile.type';

type VerifyCallback = (error: Error | null, user?: OAuthProfile) => void;

type GithubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
};

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService) {
    super({
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL', 'http://localhost/github'),
      clientID: configService.get<string>('GITHUB_CLIENT_ID', 'missing-github-client-id'),
      clientSecret: configService.get<string>(
        'GITHUB_CLIENT_SECRET',
        'missing-github-client-secret',
      ),
    });
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    try {
      const email = await this.getVerifiedEmail(accessToken);
      const oauthProfile: OAuthProfile = {
        email: email ?? '',
        emailVerified: !!email,
        avatarUrl: profile.photos?.[0]?.value ?? '',
        fullName: profile.displayName || profile.username || email || `github-${profile.id}`,
        provider: OAuthProvider.GITHUB,
        providerAccountId: profile.id,
      };

      done(null, oauthProfile);
    } catch (error) {
      done(error as Error);
    }
  }

  private async getVerifiedEmail(accessToken: string): Promise<null | string> {
    const response = await fetch('https://api.github.com/user/emails', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const emails = (await response.json()) as GithubEmail[];
    const primaryVerifiedEmail = emails.find((email) => email.primary && email.verified);
    const firstVerifiedEmail = emails.find((email) => email.verified);

    return primaryVerifiedEmail?.email ?? firstVerifiedEmail?.email ?? null;
  }
}
