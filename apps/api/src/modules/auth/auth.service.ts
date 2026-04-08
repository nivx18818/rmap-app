import type { StringValue } from 'ms';

import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';

import {
  ACCESS_TOKEN_COOKIE_OPTIONS,
  CLEAR_COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE_OPTIONS,
} from '@/common/constants/cookie-config';

import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

import { UserService } from '../user/user.service';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, fullName } = registerDto;

    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.userService.create({
      email,
      passwordHash,
      fullName,
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto, res: Response) {
    const { email, password } = loginDto;

    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    await this.issueTokens(payload, res);
    return { message: 'Login successful' };
  }

  async refresh(userId: string, email: string, req: Request, res: Response) {
    const oldToken = req.cookies?.['refresh_token'] as string | undefined;
    if (oldToken) {
      await this.refreshTokenService.revokeToken(oldToken);
    }
    const payload = { sub: userId, email };
    await this.issueTokens(payload, res);
    return { message: 'Token refreshed' };
  }

  async logout(userId: string, req: Request, res: Response) {
    await this.refreshTokenService.revokeTokensForUser(userId);
    res.clearCookie('access_token', CLEAR_COOKIE_OPTIONS);
    res.clearCookie('refresh_token', { ...CLEAR_COOKIE_OPTIONS, path: '/api/v1/auth/refresh' });
    return { message: 'Logged out successfully' };
  }

  private async issueTokens(payload: { sub: string; email: string }, res: Response) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<StringValue>('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<StringValue>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.refreshTokenService.saveRefreshToken(payload.sub, refreshToken, expiresAt);

    res.cookie('access_token', accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
    res.cookie('refresh_token', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
  }
}
