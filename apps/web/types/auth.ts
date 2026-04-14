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

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  email: string;
  fullName: string;
  password: string;
}
