import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserService } from '@/modules/user/user.service';

import { RefreshTokenService } from '../refresh-token.service';

export interface JwtRefreshPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {
    const secret = configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.['refresh_token'] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtRefreshPayload) {
    const refreshToken = req.cookies?.['refresh_token'] as string | undefined;
    if (!refreshToken) throw new UnauthorizedException('Refresh token not found');

    const storedToken = await this.refreshTokenService.findTokenValid(refreshToken);
    if (!storedToken) throw new UnauthorizedException('Refresh token revoked or expired');

    const user = await this.userService.findById(payload.sub);
    if (!user) throw new UnauthorizedException('User not found');

    return user;
  }
}
