import type { CookieOptions } from 'express';

export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

const isProduction = process.env.NODE_ENV === 'production';

const BASE_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProduction,
};

export const ACCESS_TOKEN_COOKIE_OPTIONS: CookieOptions = {
  ...BASE_COOKIE_OPTIONS,
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
};

export const REFRESH_TOKEN_COOKIE_OPTIONS: CookieOptions = {
  ...BASE_COOKIE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export const CLEAR_COOKIE_OPTIONS: CookieOptions = {
  ...BASE_COOKIE_OPTIONS,
  maxAge: 0, // Expire immediately
  path: '/',
};

export const LEGACY_REFRESH_TOKEN_CLEAR_COOKIE_OPTIONS: CookieOptions = {
  ...CLEAR_COOKIE_OPTIONS,
  path: '/api/v1/auth/refresh',
};
