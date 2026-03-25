import type { Config } from 'jest';

export const config = {
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
  },
} as const satisfies Config;
