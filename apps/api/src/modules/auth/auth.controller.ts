import type { Response, Request } from 'express';

import { Body, Controller, Post, HttpCode, HttpStatus, UseGuards, Res, Req } from '@nestjs/common';

import {
  ACCESS_TOKEN_COOKIE_OPTIONS,
  CLEAR_COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE_OPTIONS,
} from '@/common/constants/cookie-config';

import type { RequestUser } from './decorators/current-user.decorator';

import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RefreshTokenService } from './refresh-token.service';
import { cookieExtractor } from './utils/cookie-extractor';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const [accessToken, refreshToken] = await this.authService.login(loginDto);
    res.cookie('access_token', accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
    res.cookie('refresh_token', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
    return { message: 'Login successful' };
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const oldToken = cookieExtractor('REFRESH_TOKEN')(req);
    if (oldToken) {
      await this.refreshTokenService.revokeByToken(oldToken);
    }

    const [accessToken, refreshToken] = await this.authService.refresh(user.id, user.email);

    res.cookie('access_token', accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
    res.cookie('refresh_token', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

    return { message: 'Token refreshed' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: RequestUser, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(user.id);
    res.clearCookie('access_token', CLEAR_COOKIE_OPTIONS);
    res.clearCookie('refresh_token', { ...CLEAR_COOKIE_OPTIONS, path: '/api/v1/auth/refresh' });
    return { message: 'Logged out successfully' };
  }
}
