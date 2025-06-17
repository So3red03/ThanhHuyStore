'use client';
import { createContext } from 'react';
import { useUIStore } from '@/stores/uiStore';

// Keep old context for backward compatibility (but won't be used)
const SidebarContext = createContext({
  isOpen: false,
  toggleSidebar: () => {}
});

// Updated useSidebar hook - now uses Zustand store
export const useSidebar = () => {
  const { isSidebarOpen, toggleSidebar, closeSidebar, openSidebar } = useUIStore();

  return {
    isOpen: isSidebarOpen,
    toggleSidebar,
    closeSidebar,
    openSidebar
  };
};

// Simplified provider - just a wrapper now
export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // No state needed - Zustand handles everything
  return <>{children}</>;
};
