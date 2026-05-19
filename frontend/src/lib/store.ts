// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AppView, Cat, EmergencyReport } from './types';

interface AppState {
  // Auth state
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Navigation state
  currentView: AppView;
  selectedCatId: number | null;
  selectedEmergencyId: number | null;

  // Sidebar state
  sidebarOpen: boolean;

  // Auth actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;

  // Navigation actions
  setCurrentView: (view: AppView) => void;
  navigateToCatDetail: (catId: number) => void;
  navigateToEmergencyDetail: (emergencyId: number) => void;

  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // starts logged out — users must sign in with a valid UTM email
      user: null,
      token: null,
      isAuthenticated: false,

      // Navigation state
      currentView: 'login',
      selectedCatId: null,
      selectedEmergencyId: null,

      // Sidebar state
      sidebarOpen: false,

      // Auth actions
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      login: (user, token) =>
        set({ user, token, isAuthenticated: true, currentView: 'dashboard' }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          currentView: 'login',
          selectedCatId: null,
          selectedEmergencyId: null,
        }),

      // Navigation actions
      setCurrentView: (view) =>
        set({ currentView: view, selectedCatId: null, selectedEmergencyId: null }),
      navigateToCatDetail: (catId) =>
        set({ currentView: 'cat-detail', selectedCatId: catId }),
      navigateToEmergencyDetail: (emergencyId) =>
        set({ currentView: 'emergency-detail', selectedEmergencyId: emergencyId }),

      // Sidebar actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'catcare-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// --- data cache ---
interface DataCacheState {
  cats: Cat[];
  catsPagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
  emergencies: EmergencyReport[];
  emergenciesPagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
  priorityFeed: EmergencyReport[];

  setCats: (cats: Cat[], pagination: DataCacheState['catsPagination']) => void;
  setEmergencies: (emergencies: EmergencyReport[], pagination: DataCacheState['emergenciesPagination']) => void;
  setPriorityFeed: (feed: EmergencyReport[]) => void;
}

export const useDataCache = create<DataCacheState>((set) => ({
  cats: [],
  catsPagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
  emergencies: [],
  emergenciesPagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
  priorityFeed: [],

  setCats: (cats, pagination) => set({ cats, catsPagination: pagination }),
  setEmergencies: (emergencies, pagination) => set({ emergencies, emergenciesPagination: pagination }),
  setPriorityFeed: (feed) => set({ priorityFeed: feed }),
}));
