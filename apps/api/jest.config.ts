import type { Config } from 'jest';

export default {
  moduleFileExtensions: ['js', 'ts', 'json'],
  rootDir: '.',
  testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: '../../coverage/apps/api',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@repo/db/prisma/client$': '<rootDir>/test/unit/__mocks__/prismaClient.mock.ts',
    '^@repo/db/prisma/internal/prismaNamespace$':
      '<rootDir>/test/unit/__mocks__/prismaNamespace.mock.ts',
  },
} as const satisfies Config;
