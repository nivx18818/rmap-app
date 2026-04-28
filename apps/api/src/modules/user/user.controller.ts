import { Body, Controller, Get, Patch } from '@nestjs/common';

import { CurrentUser, type RequestUser } from '../auth/decorators/current-user.decorator';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getMe(@CurrentUser() user: RequestUser): CreateUserProfileDto {
    return this.formatCreateUserProfile(user);
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: RequestUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<CreateUserProfileDto> {
    const updatedUser = await this.userService.updateProfile(user.id, updateProfileDto);
    return this.formatCreateUserProfile(updatedUser);
  }

  private formatCreateUserProfile(user: CreateUserProfileDto): CreateUserProfileDto {
    return { ...user, role: user.role.toLowerCase() };
  }
}
