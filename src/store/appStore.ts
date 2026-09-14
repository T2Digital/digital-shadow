import { create } from 'zustand';
import { UserProfile } from '../../services/dbService';

interface UserState {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  updateUserPreference: (updates: Partial<UserProfile>) => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  updateUserPreference: (updates) => set((state) => ({
    currentUser: state.currentUser ? { ...state.currentUser, ...updates } : null
  })),
}));

interface AppState {
  view: 'dashboard' | 'chat' | 'pricing' | 'auth' | 'admin' | 'pending_review' | 'payment' | 'workspace' | 'affiliate';
  setView: (view: 'dashboard' | 'chat' | 'pricing' | 'auth' | 'admin' | 'pending_review' | 'payment' | 'workspace' | 'affiliate') => void;
  isLimitReached: boolean;
  setIsLimitReached: (limit: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: 'dashboard',
  setView: (view) => set({ view }),
  isLimitReached: false,
  setIsLimitReached: (limit) => set({ isLimitReached: limit })
}));
