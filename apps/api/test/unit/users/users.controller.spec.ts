/* eslint-disable @typescript-eslint/unbound-method */
import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';
import { OAuthProvider } from '@repo/db/prisma/client';

import { UsersController } from '@/modules/users/users.controller';
import { UsersService } from '@/modules/users/users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let userService: UsersService;

  const mockUserService = {
    disconnectOAuthAccount: jest.fn(),
    listIntegrations: jest.fn(),
    updateProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    userService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMe', () => {
    it('should return formatted user profile', () => {
      const mockUser = {
        avatarUrl: null,
        id: '1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'USER',
        createdAt: new Date('2025-04-24T07:00:00Z'),
      };

      const result = controller.getMe(mockUser);

      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        fullName: 'Test User',
        avatarUrl: null,
        role: 'user',
        createdAt: new Date('2025-04-24T07:00:00Z'),
      });
    });
  });

  describe('updateProfile', () => {
    it('should return updated user profile', async () => {
      const mockUser = {
        avatarUrl: null,
        id: '1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'USER',
        createdAt: new Date('2025-04-24T07:00:00Z'),
      };

      const updatedUser = {
        ...mockUser,
        fullName: 'New Name',
      };

      mockUserService.updateProfile.mockResolvedValue(updatedUser);

      const updateDto = { fullName: 'New Name' };

      const result = await controller.updateProfile(mockUser, updateDto);

      expect(userService.updateProfile).toHaveBeenCalledWith('1', updateDto);
      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        fullName: 'New Name',
        avatarUrl: null,
        role: 'user',
        createdAt: new Date('2025-04-24T07:00:00Z'),
      });
    });
  });

  describe('getIntegrations', () => {
    it('should return user integrations', async () => {
      const integrations = [
        {
          canDisconnect: true,
          connected: true,
          connectedAt: new Date('2026-06-07T01:00:00.000Z'),
          provider: OAuthProvider.GITHUB,
          providerEmail: 'github@example.com',
        },
      ];
      mockUserService.listIntegrations.mockResolvedValue(integrations);

      const result = await controller.getIntegrations({
        avatarUrl: null,
        createdAt: new Date('2025-04-24T07:00:00Z'),
        email: 'test@example.com',
        fullName: 'Test User',
        id: '1',
        role: 'USER',
      });

      expect(userService.listIntegrations).toHaveBeenCalledWith('1');
      expect(result).toEqual(integrations);
    });
  });

  describe('disconnectIntegration', () => {
    it('should parse provider and disconnect the integration', async () => {
      const user = {
        avatarUrl: null,
        createdAt: new Date('2025-04-24T07:00:00Z'),
        email: 'test@example.com',
        fullName: 'Test User',
        id: '1',
        role: 'USER',
      };

      await controller.disconnectIntegration(user, 'github');

      expect(userService.disconnectOAuthAccount).toHaveBeenCalledWith('1', OAuthProvider.GITHUB);
    });
  });
});
