import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@repo/db/prisma/internal/prismaNamespace';

import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    try {
      return await this.prisma.user.create({ data: { ...createUserDto } });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = error.meta?.target as string[] | undefined;
        const field = target?.[0];

        if (field === 'email') {
          throw new Error('Email already exist');
        }
      }
      throw error;
    }
  }
}
