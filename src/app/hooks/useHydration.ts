'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/stores/cartStore';

/**
 * Hook để kiểm tra hydration state của Zustand stores
 * Giúp tránh hydration mismatch và đảm bảo localStorage được load đúng
 */
export const useHydration = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const cartStore = useCartStore();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // Đợi cho đến khi store được hydrated
    const checkHydration = () => {
      if (cartStore._hasHydrated) {
        setIsHydrated(true);
      } else {
        // Retry sau 100ms nếu chưa hydrated
        timeoutId = setTimeout(checkHydration, 100);
      }
    };

    checkHydration();

    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [cartStore._hasHydrated]);

  return {
    isHydrated,
    cartStore
  };
};
