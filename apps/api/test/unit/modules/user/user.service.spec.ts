import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';
import { PrismaClientKnownRequestError } from '@repo/db/prisma/internal/prismaNamespace';

import { EmailAlreadyExistsException } from '@/common/exceptions/app.exceptions';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { UserService } from '@/modules/user/user.service';

describe('UserService', () => {
  let service: UserService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findById', () => {
    it('should return a user if found', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

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
      const mockUser = { id: '1', ...createUserDto };
      mockPrismaService.user.create.mockResolvedValue(mockUser);

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

      mockPrismaService.user.create.mockRejectedValue(error);

      await expect(service.create(createUserDto)).rejects.toThrow(EmailAlreadyExistsException);
    });
  });

  describe('updateProfile', () => {
    it('should update and return the user', async () => {
      const mockUser = { id: '1', fullName: 'New Name' };
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.updateProfile('1', 'New Name');

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { fullName: 'New Name' },
      });
      expect(result).toEqual(mockUser);
    });
  });
});
