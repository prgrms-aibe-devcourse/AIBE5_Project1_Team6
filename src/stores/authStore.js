import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  loading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session, loading: false }),
  signOut: () => set({ user: null, session: null }),
}));
