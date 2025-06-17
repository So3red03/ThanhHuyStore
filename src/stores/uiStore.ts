import { create } from 'zustand';

export interface UIStore {
  // Sidebar state
  isSidebarOpen: boolean;
  
  // Sidebar actions
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // Initial state
  isSidebarOpen: false,
  
  // Actions
  toggleSidebar: () => set((state) => ({ 
    isSidebarOpen: !state.isSidebarOpen 
  })),
  
  closeSidebar: () => set({ 
    isSidebarOpen: false 
  }),
  
  openSidebar: () => set({ 
    isSidebarOpen: true 
  }),
}));
