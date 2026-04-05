import type { StringValue } from 'ms';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard, JwtRefreshGuard } from './guards/jwt-auth.guard';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UserModule,
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
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, JwtAuthGuard, JwtRefreshGuard],
  controllers: [AuthController],
})
export class AuthModule {}
