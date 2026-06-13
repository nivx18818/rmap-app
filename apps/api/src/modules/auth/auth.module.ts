import type { StringValue } from 'ms';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GithubOAuthGuard } from './guards/github-oauth.guard';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { PasswordResetDeliveryService } from './password-reset-delivery.service';
import { PasswordResetTokenService } from './password-reset-token.service';
import { RefreshTokenService } from './refresh-token.service';
import { GithubStrategy } from './strategies/github.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        signOptions: {
          expiresIn: configService.get<StringValue>('JWT_EXPIRES_IN', '1h'),
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    GoogleStrategy,
    GithubStrategy,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    JwtRefreshGuard,
    GoogleOAuthGuard,
    GithubOAuthGuard,
    PasswordResetDeliveryService,
    PasswordResetTokenService,
    RefreshTokenService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
