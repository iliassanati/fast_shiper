// client/src/stores/useAuthStore.ts - FIXED VERSION
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import axios from 'axios';
import type { UserInfo, USAddress } from '@/types/client.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('🔑 Token attached to request');
  } else {
    console.warn('⚠️ No token found in localStorage');
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
  initialized: boolean;

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
        loading: true,
        error: null,
        initialized: false,

        clearError: () => set({ error: null }),

        login: async (email: string, password: string) => {
          set({ loading: true, error: null });
          try {
            console.log('🔐 Attempting login for:', email);

            const response = await api.post('/auth/login', {
              email,
              password,
            });

            console.log('✅ Login successful:', response.data);

            const { user, usAddress, token } = response.data.data;

            localStorage.setItem('auth-token', token);

            set({
              user,
              usAddress,
              token,
              isAuthenticated: true,
              loading: false,
              error: null,
              initialized: true,
            });
          } catch (error: any) {
            console.error('❌ Login failed:', error);
            const errorMessage =
              error.response?.data?.error || 'Login failed. Please try again.';
            set({
              error: errorMessage,
              loading: false,
              isAuthenticated: false,
              initialized: true,
            });
            throw new Error(errorMessage);
          }
        },

        register: async (data) => {
          set({ loading: true, error: null });
          try {
            console.log('📝 Attempting registration for:', data.email);

            const response = await api.post('/auth/register', data);

            console.log('✅ Registration successful:', response.data);

            const { user, usAddress, token } = response.data.data;

            localStorage.setItem('auth-token', token);

            set({
              user,
              usAddress,
              token,
              isAuthenticated: true,
              loading: false,
              error: null,
              initialized: true,
            });
          } catch (error: any) {
            console.error('❌ Registration failed:', error);
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
              initialized: true,
            });
            throw new Error(errorMessage);
          }
        },

        logout: async () => {
          try {
            console.log('👋 Logging out...');
            await api.post('/auth/logout');
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            localStorage.removeItem('auth-token');
            set({
              user: null,
              usAddress: null,
              token: null,
              isAuthenticated: false,
              error: null,
              loading: false,
              initialized: true,
            });
            console.log('✅ Logout complete');
          }
        },

        checkAuth: async () => {
          const token = localStorage.getItem('auth-token');

          console.log('🔍 Checking authentication...');
          console.log('Token exists:', !!token);

          if (!token) {
            console.log('❌ No token found, user not authenticated');
            set({
              loading: false,
              isAuthenticated: false,
              initialized: true,
            });
            return;
          }

          set({ loading: true });
          try {
            console.log('📡 Verifying token with server...');

            const response = await api.get('/auth/me');

            console.log('✅ Auth check successful:', response.data);

            const { user, usAddress } = response.data.data;

            set({
              user,
              usAddress,
              token,
              isAuthenticated: true,
              loading: false,
              error: null,
              initialized: true,
            });

            console.log('✅ User authenticated:', user.email);
          } catch (error: any) {
            console.error(
              '❌ Auth check failed:',
              error.response?.data || error.message
            );
            localStorage.removeItem('auth-token');
            set({
              user: null,
              usAddress: null,
              token: null,
              isAuthenticated: false,
              loading: false,
              initialized: true,
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
  console.log('🚀 Initializing auth store...');

  // Wait for hydration, then check auth
  useAuthStore.persist.onFinishHydration(() => {
    console.log('💧 Hydration complete, checking auth...');
    useAuthStore.getState().checkAuth();
  });
}
