// client/src/stores/useAdminAuthStore.ts - COMPLETE FIX
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
  role: 'super_admin' | 'admin' | 'warehouse_staff' | 'customer_support';
  permissions: string[];
  lastLogin: Date | null;
}

interface AdminAuthState {
  admin: AdminInfo | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean; // CRITICAL: Must always have a value

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (...roles: string[]) => boolean;
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
        initialized: false, // FIX: Always starts as false

        clearError: () => set({ error: null }),

        hasPermission: (permission: string) => {
          const { admin } = get();
          if (!admin) return false;
          if (admin.role === 'super_admin') return true;
          return admin.permissions.includes(permission);
        },

        hasRole: (...roles: string[]) => {
          const { admin } = get();
          if (!admin) return false;
          return roles.includes(admin.role);
        },

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
              initialized: true, // FIX: Set to true after successful login
            });
          } catch (error: any) {
            console.error('❌ Login failed:', error.response?.data);
            const errorMessage =
              error.response?.data?.error || 'Login failed. Please try again.';
            set({
              error: errorMessage,
              loading: false,
              isAuthenticated: false,
              initialized: true, // FIX: Set to true even on error
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
        // FIX: Only persist necessary fields, always include initialized
        partialize: (state) => ({
          admin: state.admin,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
          initialized: state.initialized, // FIX: Persist this!
          loading: false, // FIX: Never persist loading as true
        }),
        // FIX: Merge stored state with defaults
        merge: (persistedState: any, currentState) => {
          return {
            ...currentState,
            ...persistedState,
            // FIX: Ensure these always have valid values
            initialized: persistedState?.initialized ?? false,
            loading: false, // Never start with loading true
          };
        },
      }
    )
  )
);

// FIX: Initialize auth check on app load
if (typeof window !== 'undefined') {
  // Wait for store to hydrate, then check auth
  const initializeAuth = () => {
    const state = useAdminAuthStore.getState();
    const token = localStorage.getItem('admin-token');

    console.log('🚀 Initializing admin auth...', {
      hasToken: !!token,
      initialized: state.initialized,
    });

    if (token && !state.initialized) {
      // Has token but not initialized - check auth
      useAdminAuthStore.getState().checkAuth();
    } else if (!token) {
      // No token - mark as initialized
      useAdminAuthStore.setState({
        initialized: true,
        loading: false,
        isAuthenticated: false,
      });
    }
  };

  // Run after a brief delay to ensure store is hydrated
  setTimeout(initializeAuth, 100);
}
