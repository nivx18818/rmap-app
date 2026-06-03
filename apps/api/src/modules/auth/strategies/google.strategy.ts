import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { OAuthProvider } from '@repo/db/prisma/client';
import { type Profile, Strategy, type VerifyCallback } from 'passport-google-oauth20';

import type { OAuthProfile } from '../types/oauth-profile.type';

type GoogleProfile = Profile & {
  _json?: {
    email?: string;
    email_verified?: boolean;
    name?: string;
  };
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL', 'http://localhost/google'),
      clientID: configService.get<string>('GOOGLE_CLIENT_ID', 'missing-google-client-id'),
      clientSecret: configService.get<string>(
        'GOOGLE_CLIENT_SECRET',
        'missing-google-client-secret',
      ),
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ) {
    const email = profile._json?.email ?? profile.emails?.[0]?.value ?? '';
    const oauthProfile: OAuthProfile = {
      email,
      emailVerified: profile._json?.email_verified === true,
      fullName: profile._json?.name ?? profile.displayName ?? email,
      provider: OAuthProvider.GOOGLE,
      providerAccountId: profile.id,
    };

    done(null, oauthProfile);
  }
}
