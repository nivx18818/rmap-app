/* eslint-disable @typescript-eslint/unbound-method */
import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';
import { PrismaClientKnownRequestError } from '@repo/db/prisma/internal/prismaNamespace';

import { EmailAlreadyExistsException } from '@/common/exceptions/app.exceptions';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { UserService } from '@/modules/user/user.service';

import type { Context, MockContext } from '../../utils/prisma-mock';

import { createMockContext, resetMockContext } from '../../utils/prisma-mock';

describe('UserService', () => {
  let service: UserService;
  let prismaService: PrismaService;
  let mockCtx: MockContext;
  let ctx: Context;

  beforeEach(async () => {
    mockCtx = createMockContext();
    ctx = mockCtx as unknown as Context;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: ctx.prisma,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    resetMockContext(mockCtx);
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        fullName: 'Test',
        passwordHash: 'hash',
        role: 'USER' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockCtx.prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findById', () => {
    it('should return a user if found', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        fullName: 'Test',
        passwordHash: 'hash',
        role: 'USER' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockCtx.prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('1');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('should successfully create a user', async () => {
      const createUserDto = { email: 'test@example.com', passwordHash: 'hash', fullName: 'Test' };
      const mockUser = {
        id: '1',
        ...createUserDto,
        role: 'USER' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockCtx.prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: { ...createUserDto },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw EmailAlreadyExistsException if email is taken', async () => {
      const createUserDto = { email: 'test@example.com', passwordHash: 'hash', fullName: 'Test' };

      const error = new PrismaClientKnownRequestError('P2002', {
        code: 'P2002',
        clientVersion: '1.0',
        meta: { target: ['email'] },
      });

      mockCtx.prisma.user.create.mockRejectedValue(error);

      await expect(service.create(createUserDto)).rejects.toThrow(EmailAlreadyExistsException);
    });
  });

  describe('updateProfile', () => {
    it('should update and return the user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        fullName: 'New Name',
        role: 'USER' as const,
        createdAt: new Date('2025-04-24T07:00:00Z'),
        passwordHash: 'hash',
        updatedAt: new Date(),
      };
      mockCtx.prisma.user.update.mockResolvedValue(mockUser);

      const result = await service.updateProfile('1', { fullName: 'New Name' });

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { fullName: 'New Name' },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(mockUser);
    });
  });
});
