import type { Request } from 'express';

import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

import { InternalServerErrorException } from '@/common/exceptions/app.exceptions';

import { normalizeOAuthCallbackPath } from '../utils/oauth-callback';

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    this.assertConfigured();
    return super.canActivate(context);
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();

    return {
      scope: ['email', 'profile'],
      session: false,
      state: normalizeOAuthCallbackPath(req.query.callbackUrl, this.getOAuthCallbackUrlBase()),
    };
  }

  private assertConfigured() {
    if (
      !this.configService.get<string>('GOOGLE_CLIENT_ID') ||
      !this.configService.get<string>('GOOGLE_CLIENT_SECRET') ||
      !this.configService.get<string>('GOOGLE_CALLBACK_URL')
    ) {
      throw new InternalServerErrorException('Google OAuth is not configured');
    }
  }

  private getOAuthCallbackUrlBase(): string {
    return (
      this.configService.get<string>('CALL_BACK_URL_BASE') ??
      this.configService.get<string>('CLIENT_URL') ??
      'http://localhost:3000'
    );
  }
}
