'use client';

import { useAuthModal as useAuthModalContext } from './AuthModalProvider';

// Re-export the hook for cleaner imports
export const useAuthModal = useAuthModalContext;
