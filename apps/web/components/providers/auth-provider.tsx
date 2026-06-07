'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { AuthUser } from '@/types/auth';
import type { SignInValues, SignUpValues } from '@/validations/auth.schema';

import { authService } from '@/services/auth.service';
import { normalizeUser } from '@/utils/user';

export interface AuthContextValue {
  clearUser: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  signIn: (payload: SignInValues) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (payload: SignUpValues) => Promise<void>;
  user: AuthUser | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: AuthUser | null;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);

  const refreshUser = useCallback(async () => {
    const profile = await authService.getMe();
    setUser(normalizeUser(profile));
  }, []);

  const clearUser = useCallback(() => {
    setUser(null);
  }, []);

  const signIn = useCallback(async (payload: SignInValues) => {
    await authService.login(payload);
    const profile = await authService.getMe();
    setUser(normalizeUser(profile));
  }, []);

  const signUp = useCallback(async (payload: SignUpValues) => {
    await authService.register({
      email: payload.email,
      fullName: payload.fullName,
      password: payload.password,
    });

    // Backend register currently does not issue cookies, so sign in immediately.
    await authService.login({ email: payload.email, password: payload.password });
    const profile = await authService.getMe();
    setUser(normalizeUser(profile));
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: !!user,
      isLoading: false,
      clearUser,
      refreshUser,
      signIn,
      signOut,
      signUp,
      user,
    }),
    [clearUser, refreshUser, signIn, signOut, signUp, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }

  return context;
}
