import type { Request } from 'express';

import { cookieExtractor } from '@/modules/auth/utils/cookie-extractor';

describe('cookieExtractor', () => {
  it('returns the configured access and refresh token cookie values', () => {
    const req = {
      cookies: {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      },
    } as unknown as Request;

    expect(cookieExtractor('ACCESS_TOKEN')(req)).toBe('access-token');
    expect(cookieExtractor('REFRESH_TOKEN')(req)).toBe('refresh-token');
  });

  it('returns null when the request, cookies, or token value are missing', () => {
    expect(cookieExtractor('ACCESS_TOKEN')(undefined as unknown as Request)).toBeNull();
    expect(cookieExtractor('ACCESS_TOKEN')({} as Request)).toBeNull();
    expect(
      cookieExtractor('ACCESS_TOKEN')({ cookies: { access_token: 123 } } as unknown as Request),
    ).toBeNull();
  });
});
