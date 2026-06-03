import type { Response } from 'supertest';

export function getSetCookie(response: Response, cookieName: string): string {
  const cookies = getSetCookies(response);
  const cookie = cookies.find((value) => value.startsWith(`${cookieName}=`));

  if (!cookie) {
    throw new Error(`Missing ${cookieName} cookie`);
  }

  return cookie;
}

export function getCookieHeader(response: Response, cookieNames: string[]): string {
  const cookies = getSetCookies(response);

  return cookieNames
    .map((cookieName) => {
      const cookie = cookies.find((value) => {
        const isCookieName = value.startsWith(`${cookieName}=`);
        const cookieValue = (value.split(';')[0].split('=')[1] ?? '').trim();
        return isCookieName && cookieValue;
      });

      if (!cookie) {
        throw new Error(`Missing ${cookieName} cookie`);
      }

      return cookie.split(';')[0];
    })
    .join('; ');
}

function getSetCookies(response: Response): string[] {
  const header = response.headers['set-cookie'];

  if (!header) {
    return [];
  }

  return Array.isArray(header) ? header : [header];
}
