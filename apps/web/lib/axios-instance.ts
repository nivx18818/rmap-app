'use client';

import type { AxiosRequestConfig } from 'axios';

import axios from 'axios';

import { API_BASE_PATH, ENDPOINTS } from '@/constants/endpoints';
import { getSignInPath } from '@/utils/auth-redirect';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuthRedirect?: boolean;
  }
}

interface RetryableRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

export const axiosInstance = axios.create({
  baseURL: API_BASE_PATH,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryableRequestConfig;
    const isAuthRequest = originalRequest.url?.startsWith('/auth/');
    const shouldSkipAuthRedirect = originalRequest.skipAuthRedirect === true;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRequest &&
      !shouldSkipAuthRedirect
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosInstance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axiosInstance.post(ENDPOINTS.auth.refresh, {}, { timeout: 5000 });
        processQueue();
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        if (typeof window !== 'undefined') {
          const callbackUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
          window.location.href = getSignInPath(callbackUrl);
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
