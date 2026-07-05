import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { disconnectSocket } from '../hooks/useSocket';
import api from '../api/axios';

const useAuthStore = create(
  persist(
    (set) => ({
      user:  null,
      token: null,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', data.token);
        set({ user: data.user, token: data.token });
        return data.user;
      },

      register: async (payload) => {
        const { data } = await api.post('/auth/register', payload);
        localStorage.setItem('token', data.token);
        set({ user: data.user, token: data.token });
        return data.user;
      },

      logout: () => {
        localStorage.removeItem('token');
        disconnectSocket();
        set({ user: null, token: null });
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'smartcab-auth',
      partialize: (s) => ({ user: s.user, token: s.token }),
    }
  )
);

export default useAuthStore;