import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/utils/api/client';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        
        try {
          const response = await apiClient.post('/api/auth/login', {
            username,
            password
          });

          if (response.error) {
            throw new Error(response.error.message);
          }

          const { user, token } = response.data;
          
          // トークンを設定
          apiClient.setAuthToken(token);
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          await apiClient.post('/api/auth/logout');
          
          // トークンをクリア
          apiClient.setAuthToken(null);
          
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        
        try {
          const response = await apiClient.get('/api/auth/me');

          if (response.error) {
            throw new Error(response.error.message);
          }

          const { user } = response.data;
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      },

      setToken: (token: string | null) => {
        apiClient.setAuthToken(token);
        set({ token });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        // ストレージから復元時にトークンを設定
        if (state?.token) {
          apiClient.setAuthToken(state.token);
          // 認証状態を確認
          state.checkAuth();
        }
      }
    }
  )
);