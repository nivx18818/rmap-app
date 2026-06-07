import { randomUUID } from 'node:crypto';

export function buildDefaultAvatarUrl(seedSource?: string): string {
  const seed = encodeURIComponent((seedSource ?? randomUUID()).trim());
  return `https://api.dicebear.com/10.x/adventurer/svg?seed=${seed}`;
}

export function resolveAvatarUrl(user: {
  avatarUrl?: null | string;
  email: string;
  fullName: string;
}): string {
  return user.avatarUrl ?? buildDefaultAvatarUrl();
}
