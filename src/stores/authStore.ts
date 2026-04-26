import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/database';

interface AuthState {
  user: Omit<User, 'password'> | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: Omit<User, 'password'> | null) => void;
  setToken: (token: string | null) => void;
  login: (user: Omit<User, 'password'>, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setToken: (token) => set({ token }),
      
      login: (user, token) => {
        set({ 
          user, 
          token, 
          isAuthenticated: true,
          isLoading: false 
        });
        // Set cookie for middleware
        if (typeof document !== 'undefined') {
          document.cookie = `auth-token=${token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
        }
      },
      
      logout: () => {
        // Clear all storage
        if (typeof window !== 'undefined') {
          // Clear localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('auth-storage');
          
          // Clear sessionStorage
          sessionStorage.clear();
          
          // Clear auth-token cookie specifically
          document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
          
          // Clear all other cookies
          document.cookie.split(";").forEach((c) => {
            document.cookie = c
              .replace(/^ +/, "")
              .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          });
        }
        
        // Clear state
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          isLoading: false 
        });
      },
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      refreshUser: async () => {
        const state = get();
        if (!state.token) return;
        
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${state.token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            set({ user: data.user });
          }
        } catch (error) {
          console.error('Error refreshing user:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        isAuthenticated: state.isAuthenticated 
      }),
      onRehydrateStorage: () => async (state) => {
        // After rehydration, set loading to false and set cookie if authenticated
        if (state) {
          state.isLoading = false;
          // Set cookie if we have a token after rehydration
          if (state.token && typeof document !== 'undefined') {
            document.cookie = `auth-token=${state.token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
            // Refresh user data from server to get latest permissions
            try {
              const response = await fetch('/api/auth/me', {
                headers: {
                  'Authorization': `Bearer ${state.token}`,
                  'Content-Type': 'application/json',
                },
              });
              
              if (response.ok) {
                const data = await response.json();
                // Update user data with latest permissions from server
                state.setUser(data.user);
              }
            } catch (error) {
              console.error('Error refreshing user after rehydration:', error);
            }
          }
        }
      },
    }
  )
);

