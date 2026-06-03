export function normalizeOAuthCallbackPath(value: unknown, callbackUrlBase: string): string {
  if (typeof value !== 'string') {
    return '/';
  }

  const callbackPath = value.trim();
  if (!callbackPath.startsWith('/') || callbackPath.startsWith('//')) {
    return '/';
  }

  if (hasControlCharacter(callbackPath)) {
    return '/';
  }

  const callbackUrlOrigin = getCallbackUrlOrigin(callbackUrlBase);
  if (!callbackUrlOrigin) {
    return '/';
  }

  try {
    const url = new URL(callbackPath, callbackUrlOrigin);
    if (url.origin !== callbackUrlOrigin) {
      return '/';
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}

function getCallbackUrlOrigin(value: string): null | string {
  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
}

function hasControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const charCode = value.charCodeAt(index);
    if (charCode <= 31 || charCode === 127) {
      return true;
    }
  }

  return false;
}
