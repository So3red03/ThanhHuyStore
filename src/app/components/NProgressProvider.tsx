'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Configure NProgress for smooth experience
NProgress.configure({
  minimum: 0.3,
  easing: 'ease',
  speed: 500,
  showSpinner: false,
  trickleSpeed: 200,
  trickle: true
});

export default function NProgressProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNavigatingRef = useRef(false);

  // Handle route changes
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only start if we're actually navigating
    if (isNavigatingRef.current) {
      // Complete progress with a smooth delay
      timeoutRef.current = setTimeout(() => {
        NProgress.done();
        isNavigatingRef.current = false;
      }, 100);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname, searchParams]);

  // Intercept all link clicks to start progress immediately
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.href) {
        const url = new URL(link.href);
        const currentUrl = new URL(window.location.href);

        // Check if it's an internal navigation
        if (url.origin === currentUrl.origin && url.pathname !== currentUrl.pathname) {
          isNavigatingRef.current = true;
          NProgress.start();
        }
      }
    };

    const handleButtonClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button');

      // Check for navigation buttons (like in forms, search, etc.)
      if (
        button &&
        (button.type === 'submit' ||
          button.getAttribute('data-navigation') === 'true' ||
          button.className.includes('nav') ||
          button.className.includes('search'))
      ) {
        isNavigatingRef.current = true;
        NProgress.start();
      }
    };

    // Add event listeners
    document.addEventListener('click', handleLinkClick, true);
    document.addEventListener('click', handleButtonClick, true);

    // Handle browser navigation
    const handlePopState = () => {
      isNavigatingRef.current = true;
      NProgress.start();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleLinkClick, true);
      document.removeEventListener('click', handleButtonClick, true);
      window.removeEventListener('popstate', handlePopState);
      NProgress.done();
    };
  }, []);

  return null;
}
