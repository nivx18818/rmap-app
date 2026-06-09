import type { Response, Request } from 'express';

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import {
  ACCESS_TOKEN_COOKIE_OPTIONS,
  CLEAR_COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE_OPTIONS,
} from '@/common/constants/cookie-config';
import { Public } from '@/common/decorators/public.decorator';

import type { RequestUser } from './decorators/current-user.decorator';
import type { OAuthProfile } from './types/oauth-profile.type';

import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GithubMobileOAuthDto } from './dto/github-mobile-oauth.dto';
import { LoginDto } from './dto/login.dto';
import { MobileOAuthDto } from './dto/mobile-oauth.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GithubOAuthGuard } from './guards/github-oauth.guard';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RefreshTokenService } from './refresh-token.service';
import { cookieExtractor } from './utils/cookie-extractor';

type OAuthRequest = Request & {
  user?: OAuthProfile;
};

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
    this.setAuthCookies(res, accessToken, refreshToken);
    return { message: 'Login successful' };
  }

  @Public()
  @UseGuards(GoogleOAuthGuard)
  @Get('google')
  googleLogin() {
    return undefined;
  }

  @Public()
  @UseGuards(GoogleOAuthGuard)
  @Get('google/callback')
  async googleCallback(@Req() req: OAuthRequest, @Res() res: Response) {
    await this.handleOAuthCallback(req, res);
  }

  @Public()
  @Post('google/mobile')
  @HttpCode(HttpStatus.OK)
  async googleMobileLogin(
    @Body() mobileOAuthDto: MobileOAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const [accessToken, refreshToken] = await this.authService.loginWithGoogleMobile(
      mobileOAuthDto.idToken,
    );
    this.setAuthCookies(res, accessToken, refreshToken);
    return { message: 'Login successful' };
  }

  @Public()
  @UseGuards(GithubOAuthGuard)
  @Get('github')
  githubLogin() {
    return undefined;
  }

  @Public()
  @UseGuards(GithubOAuthGuard)
  @Get('github/callback')
  async githubCallback(@Req() req: OAuthRequest, @Res() res: Response) {
    await this.handleOAuthCallback(req, res);
  }

  @Public()
  @Post('github/mobile')
  @HttpCode(HttpStatus.OK)
  async githubMobileLogin(
    @Body() githubMobileOAuthDto: GithubMobileOAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const [accessToken, refreshToken] = await this.authService.loginWithGithubMobile(
      githubMobileOAuthDto.code,
    );
    this.setAuthCookies(res, accessToken, refreshToken);
    return { message: 'Login successful' };
  }

  @Public()
  @Post('password/forgot')
  @HttpCode(HttpStatus.ACCEPTED)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('password/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
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
    const [accessToken, refreshToken] = await this.authService.refresh(user.id, user.email);

    if (oldToken) {
      await this.refreshTokenService.markRotatedByToken(oldToken);
    }

    this.setAuthCookies(res, accessToken, refreshToken);

    return { message: 'Token refreshed' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: RequestUser, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(user.id);
    res.clearCookie('access_token', CLEAR_COOKIE_OPTIONS);
    res.clearCookie('refresh_token', CLEAR_COOKIE_OPTIONS);
    return { message: 'Logged out successfully' };
  }

  private async handleOAuthCallback(req: OAuthRequest, res: Response) {
    if (!req.user) {
      res.redirect(this.authService.getOAuthFailureRedirectUrl(req.query.state));
      return;
    }

    try {
      const [accessToken, refreshToken] = await this.authService.loginWithOAuth(req.user);
      this.setAuthCookies(res, accessToken, refreshToken);
      res.redirect(this.authService.getOAuthRedirectUrl(req.query.state));
    } catch {
      res.redirect(this.authService.getOAuthFailureRedirectUrl(req.query.state));
    }
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('access_token', accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
    res.cookie('refresh_token', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
  }
}
