// client/src/stores/useAuthStore.ts - UPDATED VERSION
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import axios from 'axios';
import type { UserInfo, USAddress } from '@/types/client.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337/api';

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface AuthState {
  user: UserInfo | null;
  usAddress: USAddress | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    city: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: UserInfo) => void;
  setUSAddress: (address: USAddress) => void;
  updateProfile: (updates: Partial<UserInfo>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        usAddress: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,

        clearError: () => set({ error: null }),

        login: async (email: string, password: string) => {
          set({ loading: true, error: null });
          try {
            const response = await api.post('/auth/login', {
              email,
              password,
            });

            const { user, usAddress, token } = response.data.data;

            // Store token
            localStorage.setItem('auth-token', token);

            set({
              user,
              usAddress,
              token,
              isAuthenticated: true,
              loading: false,
              error: null,
            });
          } catch (error: any) {
            const errorMessage =
              error.response?.data?.error || 'Login failed. Please try again.';
            set({
              error: errorMessage,
              loading: false,
              isAuthenticated: false,
            });
            throw new Error(errorMessage);
          }
        },

        register: async (data) => {
          set({ loading: true, error: null });
          try {
            const response = await api.post('/auth/register', data);

            const { user, usAddress, token } = response.data.data;

            // Store token
            localStorage.setItem('auth-token', token);

            set({
              user,
              usAddress,
              token,
              isAuthenticated: true,
              loading: false,
              error: null,
            });
          } catch (error: any) {
            const errorMessage =
              error.response?.data?.error ||
              error.response?.data?.errors ||
              'Registration failed. Please try again.';
            set({
              error:
                typeof errorMessage === 'object'
                  ? Object.values(errorMessage).join(', ')
                  : errorMessage,
              loading: false,
            });
            throw new Error(errorMessage);
          }
        },

        logout: async () => {
          try {
            // Call logout endpoint (optional, since JWT is stateless)
            await api.post('/auth/logout');
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            // Clear local storage and state
            localStorage.removeItem('auth-token');
            set({
              user: null,
              usAddress: null,
              token: null,
              isAuthenticated: false,
              error: null,
            });
          }
        },

        checkAuth: async () => {
          const token = localStorage.getItem('auth-token');

          if (!token) {
            set({ loading: false, isAuthenticated: false });
            return;
          }

          set({ loading: true });
          try {
            const response = await api.get('/auth/me');
            const { user, usAddress } = response.data.data;

            set({
              user,
              usAddress,
              token,
              isAuthenticated: true,
              loading: false,
              error: null,
            });
          } catch (error) {
            // Token is invalid, clear everything
            localStorage.removeItem('auth-token');
            set({
              user: null,
              usAddress: null,
              token: null,
              isAuthenticated: false,
              loading: false,
            });
          }
        },

        setUser: (user) => set({ user, isAuthenticated: true }),

        setUSAddress: (address) => set({ usAddress: address }),

        updateProfile: async (updates) => {
          const currentUser = get().user;
          if (!currentUser) return;

          set({ loading: true, error: null });
          try {
            const response = await api.put('/auth/profile', updates);
            const { user } = response.data.data;

            set({
              user,
              loading: false,
            });
          } catch (error: any) {
            const errorMessage =
              error.response?.data?.error || 'Failed to update profile';
            set({
              error: errorMessage,
              loading: false,
            });
            throw new Error(errorMessage);
          }
        },
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          usAddress: state.usAddress,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
);

// Initialize auth on app load
if (typeof window !== 'undefined') {
  useAuthStore.getState().checkAuth();
}
