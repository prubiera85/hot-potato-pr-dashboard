import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole, UserPermissions } from '../types/github';
import { ROLE_PERMISSIONS } from '../types/github';

export interface User {
  login: string;
  id: number;
  avatar_url: string;
  email: string | null;
  name: string | null;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  permissions: UserPermissions | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  getPermissions: () => UserPermissions;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      permissions: null,

      login: (token: string, user: User) => {
        const permissions = ROLE_PERMISSIONS[user.role];
        set({
          token,
          user,
          isAuthenticated: true,
          permissions,
        });
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          permissions: null,
        });
      },

      updateUser: (user: User) => {
        const permissions = ROLE_PERMISSIONS[user.role];
        set({ user, permissions });
      },

      getPermissions: () => {
        const state = get();
        if (!state.user) {
          return ROLE_PERMISSIONS.guest; // Fallback to guest permissions
        }
        return ROLE_PERMISSIONS[state.user.role];
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      version: 1, // Add version to trigger migration when structure changes
      migrate: (persistedState: any, version: number) => {
        // If old version or no version, rebuild permissions from user role
        if (version === 0 || !version) {
          const state = persistedState as AuthState;
          if (state.user) {
            state.permissions = ROLE_PERMISSIONS[state.user.role];
          }
        }
        return persistedState as AuthState;
      },
    }
  )
);
