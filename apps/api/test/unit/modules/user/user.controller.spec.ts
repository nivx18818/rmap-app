import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';

import { UserController } from '@/modules/user/user.controller';
import { UserService } from '@/modules/user/user.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  const mockUserService = {
    updateProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMe', () => {
    it('should return formatted user profile', () => {
      const mockUser = {
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
        full_name: 'Test User',
        role: 'user',
        created_at: new Date('2025-04-24T07:00:00Z'),
      });
    });
  });

  describe('updateProfile', () => {
    it('should return updated user profile', async () => {
      const mockUser = {
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

      const updateDto = { full_name: 'New Name' };

      const result = await controller.updateProfile(mockUser, updateDto);

      expect(userService.updateProfile).toHaveBeenCalledWith('1', 'New Name');
      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        full_name: 'New Name',
        role: 'user',
        created_at: new Date('2025-04-24T07:00:00Z'),
      });
    });
  });
});
