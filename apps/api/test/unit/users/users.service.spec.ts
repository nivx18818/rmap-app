/* eslint-disable @typescript-eslint/unbound-method */
import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';
import { OAuthProvider, UserRole, type User } from '@repo/db/prisma/client';
import { PrismaClientKnownRequestError } from '@repo/db/prisma/internal/prismaNamespace';

import { EmailAlreadyExistsException } from '@/common/exceptions/app.exceptions';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { UsersService } from '@/modules/users/users.service';

import type { Context, MockContext } from '../../utils/prisma-mock';

import { createMockContext, resetMockContext } from '../../utils/prisma-mock';

const makeUser = (overrides: Partial<User> = {}): User => ({
  createdAt: new Date('2025-04-24T07:00:00.000Z'),
  email: 'test@example.com',
  fullName: 'Test',
  id: '1',
  passwordHash: 'hash',
  role: UserRole.USER,
  updatedAt: new Date('2025-04-24T07:00:00.000Z'),
  ...overrides,
});

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;
  let mockCtx: MockContext;
  let ctx: Context;

  beforeEach(async () => {
    mockCtx = createMockContext();
    ctx = mockCtx as unknown as Context;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: ctx.prisma,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    resetMockContext(mockCtx);
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      const mockUser = makeUser();
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
      const mockUser = makeUser();
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
      const mockUser = makeUser(createUserDto);
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

  describe('createWithOAuth', () => {
    it('should create a user with a linked OAuth account and no password hash', async () => {
      const createUserDto = { email: 'oauth@example.com', fullName: 'OAuth User' };
      const oauth = {
        provider: OAuthProvider.GOOGLE,
        providerAccountId: 'google-123',
        providerEmail: 'oauth@example.com',
      };
      const mockUser = makeUser({ ...createUserDto, passwordHash: null });
      mockCtx.prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.createWithOAuth(createUserDto, oauth);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...createUserDto,
          passwordHash: null,
          oauthAccounts: {
            create: {
              provider: OAuthProvider.GOOGLE,
              providerAccountId: 'google-123',
              providerEmail: 'oauth@example.com',
            },
          },
        },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByOAuthAccount', () => {
    it('should return the linked user if the OAuth account exists', async () => {
      const mockUser = makeUser();
      mockCtx.prisma.oAuthAccount.findUnique.mockResolvedValue({
        user: mockUser,
      } as unknown as Awaited<ReturnType<typeof prismaService.oAuthAccount.findUnique>>);

      const result = await service.findByOAuthAccount({
        provider: OAuthProvider.GITHUB,
        providerAccountId: 'github-123',
      });

      expect(prismaService.oAuthAccount.findUnique).toHaveBeenCalledWith({
        where: {
          provider_providerAccountId: {
            provider: OAuthProvider.GITHUB,
            providerAccountId: 'github-123',
          },
        },
        include: { user: true },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('linkOAuthAccount', () => {
    it('should link an OAuth account to an existing user', async () => {
      const mockUser = makeUser();
      mockCtx.prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.linkOAuthAccount('1', {
        provider: OAuthProvider.GOOGLE,
        providerAccountId: 'google-123',
        providerEmail: 'test@example.com',
      });

      expect(prismaService.oAuthAccount.create).toHaveBeenCalledWith({
        data: {
          provider: OAuthProvider.GOOGLE,
          providerAccountId: 'google-123',
          providerEmail: 'test@example.com',
          userId: '1',
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return the existing linked user if OAuth account linking races', async () => {
      const mockUser = makeUser();
      const error = new PrismaClientKnownRequestError('P2002', {
        code: 'P2002',
        clientVersion: '1.0',
        meta: { target: ['provider', 'providerAccountId'] },
      });

      mockCtx.prisma.oAuthAccount.create.mockRejectedValue(error);
      mockCtx.prisma.oAuthAccount.findUnique.mockResolvedValue({
        user: mockUser,
      } as unknown as Awaited<ReturnType<typeof prismaService.oAuthAccount.findUnique>>);

      const result = await service.linkOAuthAccount('1', {
        provider: OAuthProvider.GITHUB,
        providerAccountId: 'github-123',
        providerEmail: 'test@example.com',
      });

      expect(result).toEqual(mockUser);
    });
  });

  describe('updateProfile', () => {
    it('should update and return the user', async () => {
      const mockUser = {
        createdAt: new Date('2025-04-24T07:00:00Z'),
        email: 'test@example.com',
        fullName: 'New Name',
        id: '1',
        role: UserRole.USER,
      };
      mockCtx.prisma.user.update.mockResolvedValue(mockUser as unknown as User);

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
