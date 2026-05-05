import { create } from 'zustand';

interface AuthState {
  token: string | null;
  isAdmin: boolean;
  login: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  isAdmin: !!localStorage.getItem('token'),
  login: (token) => {
    localStorage.setItem('token', token);
    set({ token, isAdmin: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, isAdmin: false });
  },
}));
