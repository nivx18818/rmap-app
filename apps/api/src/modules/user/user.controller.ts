import { Body, Controller, Get, Patch } from '@nestjs/common';

import { CurrentUser, type RequestUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getMe(@CurrentUser() user: RequestUser): UserProfileDto {
    return this.formatUserProfile(user);
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: RequestUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    const updatedUser = await this.userService.updateProfile(user.id, updateProfileDto);
    return this.formatUserProfile(updatedUser);
  }

  private formatUserProfile(user: UserProfileDto): UserProfileDto {
    const { role, ...rest } = user;
    return { ...rest, role: role.toLowerCase() };
  }
}
