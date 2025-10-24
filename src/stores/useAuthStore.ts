// src/stores/useAuthStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { UserInfo, USAddress } from '@/types/client.types';

interface AuthState {
  user: UserInfo | null;
  usAddress: USAddress | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: UserInfo) => void;
  setUSAddress: (address: USAddress) => void;
  updateProfile: (updates: Partial<UserInfo>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        usAddress: null,
        isAuthenticated: false,
        loading: false,
        error: null,

        // Add after other actions:
        initialize: () => {
          const storedState = localStorage.getItem('auth-store');
          if (storedState) {
            try {
              const parsed = JSON.parse(storedState);
              if (parsed.state) {
                set({
                  user: parsed.state.user,
                  usAddress: parsed.state.usAddress,
                  isAuthenticated: parsed.state.isAuthenticated,
                  loading: false,
                });
              }
            } catch (error) {
              console.error('Failed to initialize auth state:', error);
              set({ loading: false });
            }
          } else {
            set({ loading: false });
          }
        },

        login: async (email: string, password: string) => {
          set({ loading: true, error: null });
          try {
            // TODO: Replace with actual API call
            // const response = await authAPI.login(email, password);

            // Mock data for now
            const mockUser: UserInfo = {
              id: 'USER001',
              name: 'Youssef El Amrani',
              email: email,
              suiteNumber: 'MA-1234',
              avatar: '👨',
              phone: '+212 6XX-XXXXXX',
              address: {
                street: '123 Rue Mohammed V, Apt 4B',
                city: 'Casablanca',
                postalCode: '20000',
                country: 'Morocco',
              },
            };

            const mockUSAddress: USAddress = {
              name: mockUser.name,
              suite: `Suite ${mockUser.suiteNumber}`,
              street: '123 Warehouse Drive',
              city: 'Wilmington, DE 19801',
              country: 'United States',
              phone: '+1 (555) 123-4567',
            };

            set({
              user: mockUser,
              usAddress: mockUSAddress,
              isAuthenticated: true,
              loading: false,
            });
          } catch (error) {
            set({
              error: 'Login failed. Please check your credentials.',
              loading: false,
            });
            throw error;
          }
        },

        logout: () => {
          set({
            user: null,
            usAddress: null,
            isAuthenticated: false,
            error: null,
          });
        },

        setUser: (user) => set({ user, isAuthenticated: true }),

        setUSAddress: (address) => set({ usAddress: address }),

        updateProfile: async (updates) => {
          const currentUser = get().user;
          if (!currentUser) return;

          set({ loading: true, error: null });
          try {
            // TODO: API call
            // await userAPI.updateProfile(updates);

            set({
              user: { ...currentUser, ...updates },
              loading: false,
            });
          } catch (error) {
            set({
              error: 'Failed to update profile',
              loading: false,
            });
            throw error;
          }
        },
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          usAddress: state.usAddress,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
);
