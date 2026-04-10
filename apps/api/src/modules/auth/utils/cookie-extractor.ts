import type { Request } from 'express';

import { COOKIE_NAMES } from '@/common/constants/cookie-config';

export const cookieExtractor =
  (type: 'ACCESS_TOKEN' | 'REFRESH_TOKEN') =>
  (req: Request): string | null => {
    if (req && req.cookies) {
      const token = req.cookies[COOKIE_NAMES[type]];
      return typeof token === 'string' ? token : null;
    }
    return null;
  };
