import type { OAuthProvider } from '@repo/db/prisma/client';

export type OAuthProfile = {
  email: string;
  emailVerified: boolean;
  fullName: string;
  provider: OAuthProvider;
  providerAccountId: string;
};
