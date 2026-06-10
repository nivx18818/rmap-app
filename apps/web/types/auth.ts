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
  createdAt?: string;
  email: string;
  fullName: string;
  id: string;
  role?: string;
}

export type OAuthProvider = 'GITHUB' | 'GOOGLE';

export interface UserIntegration {
  canDisconnect: boolean;
  connected: boolean;
  connectedAt: null | string;
  provider: OAuthProvider;
  providerEmail: null | string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfilePayload {
  fullName: string;
  avatarUrl?: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  newPassword: string;
  token: string;
}

export interface SignUpPayload {
  avatarUrl?: string;
  email: string;
  fullName: string;
  password: string;
}
