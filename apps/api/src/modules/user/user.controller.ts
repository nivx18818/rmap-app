import type { User } from '@repo/db/prisma/client';

import { Controller, Get, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UserController {
  @UseGuards(AuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: User) {
    const { passwordHash, ...result } = user;
    return result;
  }
}
