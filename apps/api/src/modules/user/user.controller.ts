import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { CurrentUser, type RequestUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: RequestUser) {
    return this.formatUserProfile(user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(
    @CurrentUser() user: RequestUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const updatedUser = await this.userService.updateProfile(user.id, updateProfileDto.full_name);
    return this.formatUserProfile(updatedUser);
  }

  private formatUserProfile(user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      role: user.role.toLowerCase(),
      created_at: user.createdAt,
    };
  }
}
