'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Configure NProgress for smooth experience
NProgress.configure({
  minimum: 0.3,
  easing: 'ease',
  speed: 800,
  showSpinner: false,
  trickleSpeed: 200,
  trickle: true
});

export default function NProgressProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Start progress immediately
    NProgress.start();

    // Complete progress with a smooth delay
    timeoutRef.current = setTimeout(() => {
      NProgress.done();
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Ensure progress is completed on cleanup
      NProgress.done();
    };
  }, [pathname, searchParams]);

  // Also handle browser back/forward navigation
  useEffect(() => {
    const handleStart = () => NProgress.start();
    const handleComplete = () => {
      setTimeout(() => NProgress.done(), 200);
    };

    // Listen for browser navigation events
    window.addEventListener('beforeunload', handleStart);
    window.addEventListener('load', handleComplete);

    return () => {
      window.removeEventListener('beforeunload', handleStart);
      window.removeEventListener('load', handleComplete);
    };
  }, []);

  return null;
}
