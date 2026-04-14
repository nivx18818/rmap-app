import { ENDPOINTS } from '@/constants/endpoints';
import { axiosInstance } from '@/lib/axios-instance';
import { type AuthApiUser, type SignInPayload, type SignUpPayload } from '@/types/auth';

export const authService = {
  getMe: async () => {
    const response = await axiosInstance.get<AuthApiUser>(ENDPOINTS.users.me);
    return response.data;
  },
  login: async (payload: SignInPayload) => {
    await axiosInstance.post<void>(ENDPOINTS.auth.login, payload);
  },
  logout: async () => {
    await axiosInstance.post<void>(ENDPOINTS.auth.logout);
  },
  refresh: async () => {
    await axiosInstance.post<void>(ENDPOINTS.auth.refresh);
  },
  register: async (payload: SignUpPayload) => {
    const response = await axiosInstance.post<AuthApiUser>(ENDPOINTS.auth.register, payload);
    return response.data;
  },
};
