import type { PrismaClient } from '@repo/db/prisma/client';
import type { DeepMockProxy } from 'jest-mock-extended';

import { mockDeep, mockReset } from 'jest-mock-extended';

export type Context = { prisma: PrismaClient };
export type MockContext = { prisma: DeepMockProxy<PrismaClient> };

export const createMockContext = (): MockContext => ({
  prisma: mockDeep<PrismaClient>(),
});

export const resetMockContext = (mockContext: MockContext) => {
  mockReset(mockContext.prisma);
};
