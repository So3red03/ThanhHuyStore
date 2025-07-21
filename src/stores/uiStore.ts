import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface UIStore {
  // Sidebar state
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;

  // Sidebar actions
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  subscribeWithSelector(set => ({
    // Initial state - ensure consistent between server and client
    isSidebarOpen: false,
    isSidebarCollapsed: false,

    // Actions
    toggleSidebar: () =>
      set(state => ({
        isSidebarOpen: !state.isSidebarOpen
      })),

    closeSidebar: () =>
      set({
        isSidebarOpen: false
      }),

    openSidebar: () =>
      set({
        isSidebarOpen: true
      }),

    toggleCollapse: () =>
      set(state => ({
        isSidebarCollapsed: !state.isSidebarCollapsed
      })),

    setCollapsed: (collapsed: boolean) =>
      set({
        isSidebarCollapsed: collapsed
      })
  }))
);
