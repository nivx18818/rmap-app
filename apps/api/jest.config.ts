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
    '^@repo/db/prisma/client$': '<rootDir>/test/utils/prisma-client.mock.ts',
    '^@repo/db/prisma/internal/prismaNamespace$': '<rootDir>/test/utils/prisma-namespace.mock.ts',
  },
} as const satisfies Config;
