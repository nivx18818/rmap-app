import { cookies } from 'next/headers';

import { ENDPOINTS } from '@/constants/endpoints';
import { fetchWrapper } from '@/lib/fetch-wrapper';
import { type AuthApiUser, type AuthUser } from '@/types/auth';
import { normalizeUser } from '@/utils/user';

export const authServerData = {
  getInitialUser: async (): Promise<AuthUser | null> => {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    if (!cookieHeader) {
      return null;
    }

    try {
      const user = await fetchWrapper<AuthApiUser>(ENDPOINTS.users.me, {
        cache: 'no-store',
        headers: {
          Cookie: cookieHeader,
        },
      });

      return normalizeUser(user);
    } catch {
      return null;
    }
  },
};
