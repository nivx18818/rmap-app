export interface AuthUser {
  avatarUrl: string;
  createdAt?: string;
  email: string;
  fullName: string;
  id: string;
  role?: string;
}

export interface AuthApiUser {
  avatarUrl?: string | null;
  avatar_url?: string | null;
  createdAt?: string;
  created_at?: string;
  email: string;
  fullName?: string;
  full_name?: string;
  id: string;
  role?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfilePayload {
  fullName: string;
  avatarUrl?: null | string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  avatarUrl: string;
  email: string;
  fullName: string;
  password: string;
}
