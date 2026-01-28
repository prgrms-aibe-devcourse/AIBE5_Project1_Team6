import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  loading: true,
  isGuest: false,
  guestId: null,
  showAuth: false,
  showLoginPrompt: false,
  setUser: (user) => set({ user, isGuest: false, guestId: null }), // Clear guest mode on login
  setSession: (session) => set({ session, loading: false }),
  setGuest: (isGuest) => set({ isGuest, guestId: isGuest ? Math.random().toString(36).substring(2, 6).toUpperCase() : null }),
  setShowAuth: (showAuth) => set({ showAuth }),
  setShowLoginPrompt: (showLoginPrompt) => set({ showLoginPrompt }),
  signOut: () => set({ user: null, session: null, isGuest: false, guestId: null }),
}));
