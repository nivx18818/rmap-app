import type { Request } from 'express';

import { COOKIE_NAMES } from '@/common/constants/cookie-config';

export const cookieExtractor =
  (name: keyof typeof COOKIE_NAMES) =>
  (req: Request): string | null => {
    if (req && req.cookies) {
      const cookies = req.cookies as Record<string, string>;
      const token = cookies[COOKIE_NAMES[name]];
      return typeof token === 'string' ? token : null;
    }
    return null;
  };
