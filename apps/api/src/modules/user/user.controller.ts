import { Body, Controller, Get, Patch } from '@nestjs/common';

import { CurrentUser, type RequestUser } from '../auth/decorators/current-user.decorator';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
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
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<CreateUserProfileDto> {
    const updatedUser = await this.userService.updateProfile(user.id, updateUserProfileDto);
    return this.formatCreateUserProfile(updatedUser);
  }

  private formatCreateUserProfile(user: CreateUserProfileDto): CreateUserProfileDto {
    return { ...user, role: user.role.toLowerCase() };
  }
}
