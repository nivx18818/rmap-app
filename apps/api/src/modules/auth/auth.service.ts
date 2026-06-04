import type { StringValue } from 'ms';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';

import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  UserNotFoundException,
} from '@/common/exceptions/app.exceptions';

import type { ForgotPasswordDto } from './dto/forgot-password.dto';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { ResetPasswordDto } from './dto/reset-password.dto';

import { UserService } from '../user/user.service';
import { PasswordResetDeliveryService } from './password-reset-delivery.service';
import { PasswordResetTokenService } from './password-reset-token.service';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly passwordResetTokenService: PasswordResetTokenService,
    private readonly passwordResetDeliveryService: PasswordResetDeliveryService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, fullName } = registerDto;

    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new EmailAlreadyExistsException(email);
    }

    const passwordHash = await this.hashPassword(password);

    const user = await this.userService.create({
      email,
      passwordHash,
      fullName,
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userService.findByEmail(email);
    if (!user) {
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

  async refresh(userId: string, email: string) {
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

  private async issueTokens(payload: { sub: string; email: string }) {
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

  private async hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
  }
}
