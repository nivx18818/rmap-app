import type { Request } from 'express';

import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

import { InternalServerErrorException } from '@/common/exceptions/app.exceptions';

import { normalizeOAuthCallbackPath } from '../utils/oauth-callback';

@Injectable()
export class GithubOAuthGuard extends AuthGuard('github') {
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
      scope: ['user:email'],
      session: false,
      state: normalizeOAuthCallbackPath(req.query.callbackUrl, this.getOAuthCallbackUrlBase()),
    };
  }

  private assertConfigured() {
    if (
      !this.configService.get<string>('GITHUB_CLIENT_ID') ||
      !this.configService.get<string>('GITHUB_CLIENT_SECRET') ||
      !this.configService.get<string>('GITHUB_CALLBACK_URL')
    ) {
      throw new InternalServerErrorException('GitHub OAuth is not configured');
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
