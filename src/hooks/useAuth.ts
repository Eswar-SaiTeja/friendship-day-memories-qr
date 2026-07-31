import { create } from 'zustand';
import { SessionUser } from '../types';

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: SessionUser | null) => void;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  checkSession: async () => {
    try {
      set({ loading: true });
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      set({ user: data.user, initialized: true });
    } catch (error) {
      console.error('Session check failed:', error);
      set({ user: null, initialized: true });
    } finally {
      set({ loading: false });
    }
  },
  logout: async () => {
    try {
      set({ loading: true });
      await fetch('/api/auth/logout', { method: 'POST' });
      set({ user: null });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      set({ loading: false });
    }
  }
}));
