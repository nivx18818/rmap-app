import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import {
  AppUnauthorizedException,
  InternalServerErrorException,
  MissingAuthenticationException,
  RefreshTokenInvalidException,
} from '@/common/exceptions/app.exceptions';
import { UserService } from '@/modules/user/user.service';

import { RefreshTokenService } from '../refresh-token.service';
import { cookieExtractor } from '../utils/cookie-extractor';

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
      throw new InternalServerErrorException('JWT_REFRESH_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor('REFRESH_TOKEN')]),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtRefreshPayload) {
    const refreshToken = cookieExtractor('REFRESH_TOKEN')(req);
    if (!refreshToken) throw new MissingAuthenticationException();

    const storedRefreshToken = await this.refreshTokenService.findValid(payload.sub, refreshToken);
    if (!storedRefreshToken) throw new RefreshTokenInvalidException();

    const user = await this.userService.findById(payload.sub);
    if (!user) throw new AppUnauthorizedException('User not found');

    return user;
  }
}
