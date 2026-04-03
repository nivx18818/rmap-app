import { Controller, Get, UseGuards } from '@nestjs/common';

import { CurrentUser, type RequestUser } from '../auth/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UserController {
  @UseGuards(AuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: RequestUser) {
    return user;
  }
}
