export const AVATAR_COUNT = 32;

export function generateSeeds(): string[] {
  return Array.from({ length: AVATAR_COUNT }, () => crypto.randomUUID());
}

export function buildAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/10.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;
}
