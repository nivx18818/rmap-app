import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@repo/db/prisma/internal/prismaNamespace';

import { EmailAlreadyExistsException } from '@/common/exceptions/app.exceptions';

import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfileDto } from './dto/user-profile.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(createUserDto: CreateUserDto) {
    try {
      return await this.prisma.user.create({ data: { ...createUserDto } });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = error.meta?.target as string[] | undefined;
        const field = target?.[0];

        if (field === 'email') {
          throw new EmailAlreadyExistsException(createUserDto.email);
        }
      }
      throw error;
    }
  }

  async updateProfile(id: string, updateProfileDto: UpdateProfileDto): Promise<UserProfileDto> {
    return await this.prisma.user.update({
      where: { id },
      data: { ...updateProfileDto },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });
  }
}
