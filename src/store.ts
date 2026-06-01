import { create } from 'zustand';

interface AppState {
    currentRoute: 'dashboard' | 'new_job' | 'active_jobs' | 'checkout' | 'employees' | 'services';
    setRoute: (route: AppState['currentRoute']) => void;
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    currentRoute: 'dashboard',
    setRoute: (route) => set({ currentRoute: route }),
    isSidebarOpen: true,
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
