import { type AuthApiUser, type AuthUser } from '@/types/auth';

function buildDefaultAvatar(seedSource: string) {
  const seed = encodeURIComponent(seedSource.trim() || 'user');
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}`;
}

export function normalizeUser(user: AuthApiUser): AuthUser {
  const fullName = user.fullName ?? user.full_name ?? 'User';
  const email = user.email;
  const avatarUrl = user.avatarUrl ?? user.avatar_url ?? buildDefaultAvatar(fullName || email);

  return {
    avatarUrl,
    createdAt: user.createdAt ?? user.created_at,
    email,
    fullName,
    id: user.id,
    role: user.role,
  };
}
