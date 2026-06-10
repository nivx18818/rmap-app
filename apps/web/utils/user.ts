import { type AuthApiUser, type AuthUser } from '@/types/auth';

export function buildDefaultAvatar(seedSource: string) {
  const defaultSource = crypto.randomUUID();
  const seed = encodeURIComponent(seedSource.trim() || defaultSource);
  return `https://api.dicebear.com/10.x/adventurer/svg?seed=${seed}`;
}

export function normalizeUser(user: AuthApiUser): AuthUser {
  return {
    avatarUrl: user.avatarUrl ?? buildDefaultAvatar(user.email),
    createdAt: user.createdAt,
    email: user.email,
    fullName: user.fullName,
    id: user.id,
    role: user.role,
  };
}
