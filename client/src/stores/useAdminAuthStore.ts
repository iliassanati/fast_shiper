// client/src/stores/useAdminAuthStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface AdminInfo {
  id: string;
  name: string;
  email: string;
  lastLogin: Date | null;
}

interface AdminAuthState {
  admin: AdminInfo | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  devtools(
    persist(
      (set, get) => ({
        admin: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        initialized: false,

        clearError: () => set({ error: null }),

        login: async (email: string, password: string) => {
          set({ loading: true, error: null });
          try {
            console.log('🔐 Attempting admin login...');

            const response = await api.post('/admin/auth/login', {
              email,
              password,
            });

            const { admin, token } = response.data.data;

            console.log('✅ Login successful:', admin.email);

            localStorage.setItem('admin-token', token);

            set({
              admin,
              token,
              isAuthenticated: true,
              loading: false,
              error: null,
              initialized: true,
            });
          } catch (error: any) {
            console.error('❌ Login failed:', error.response?.data);
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

        logout: async () => {
          try {
            await api.post('/admin/auth/logout');
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            localStorage.removeItem('admin-token');
            set({
              admin: null,
              token: null,
              isAuthenticated: false,
              error: null,
              loading: false,
              initialized: true,
            });
          }
        },

        checkAuth: async () => {
          console.log('🔍 Checking admin authentication...');

          const token = localStorage.getItem('admin-token');

          if (!token) {
            console.log('❌ No token found');
            set({
              loading: false,
              isAuthenticated: false,
              initialized: true,
              admin: null,
              token: null,
            });
            return;
          }

          set({ loading: true });
          try {
            console.log('🔄 Verifying admin token...');

            const response = await api.get('/admin/auth/me');
            const { admin } = response.data.data;

            console.log('✅ Admin verified:', admin.email);

            set({
              admin,
              token,
              isAuthenticated: true,
              loading: false,
              error: null,
              initialized: true,
            });
          } catch (error) {
            console.error('❌ Auth check failed:', error);
            localStorage.removeItem('admin-token');
            set({
              admin: null,
              token: null,
              isAuthenticated: false,
              loading: false,
              initialized: true,
            });
          }
        },
      }),
      {
        name: 'admin-auth-store',
        partialize: (state) => ({
          admin: state.admin,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
          initialized: state.initialized,
          loading: false,
        }),
        merge: (persistedState: any, currentState) => {
          return {
            ...currentState,
            ...persistedState,
            initialized: persistedState?.initialized ?? false,
            loading: false,
          };
        },
      }
    )
  )
);

// Initialize auth check on app load
if (typeof window !== 'undefined') {
  const initializeAuth = () => {
    const state = useAdminAuthStore.getState();
    const token = localStorage.getItem('admin-token');

    console.log('🚀 Initializing admin auth...', {
      hasToken: !!token,
      initialized: state.initialized,
    });

    if (token && !state.initialized) {
      useAdminAuthStore.getState().checkAuth();
    } else if (!token) {
      useAdminAuthStore.setState({
        initialized: true,
        loading: false,
        isAuthenticated: false,
      });
    }
  };

  setTimeout(initializeAuth, 100);
}
