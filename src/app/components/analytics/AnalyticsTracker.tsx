'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAnalyticsTracker } from '@/app/hooks/useAnalytics';

interface AnalyticsTrackerProps {
  children: React.ReactNode;
}

const AnalyticsTracker: React.FC<AnalyticsTrackerProps> = ({ children }) => {
  const pathname = usePathname();
  const { trackEvent } = useAnalyticsTracker();

  // Refs để tránh duplicate tracking
  const lastTrackedPath = useRef<string>('');
  const trackingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Page view tracking removed - simplified to only track product_view and article_view

  // Track product views
  useEffect(() => {
    const trackProductView = () => {
      if (!pathname || pathname === lastTrackedPath.current) return;

      // Check if we're on a product page - format: /product/slug-productId
      const productMatch = pathname.match(/\/product\/(.+)-([a-f0-9]{24})$/);
      if (productMatch) {
        const fullSlug = productMatch[1];
        const productId = productMatch[2];

        // Clear previous timeout
        if (trackingTimeout.current) {
          clearTimeout(trackingTimeout.current);
        }

        // Debounce tracking để tránh duplicate
        trackingTimeout.current = setTimeout(() => {
          trackEvent({
            eventType: 'PRODUCT_VIEW',
            entityType: 'product',
            entityId: productId,
            path: pathname,
            metadata: {
              productSlug: fullSlug,
              productId: productId,
              fullPath: pathname,
              timestamp: new Date().toISOString()
            }
          });
          lastTrackedPath.current = pathname;
        }, 500); // 500ms debounce
      }
    };

    trackProductView();

    // Cleanup timeout on unmount
    return () => {
      if (trackingTimeout.current) {
        clearTimeout(trackingTimeout.current);
      }
    };
  }, [pathname, trackEvent]);

  // Track article views với debounce
  useEffect(() => {
    const trackArticleView = () => {
      if (!pathname || pathname === lastTrackedPath.current) return;

      // Check if we're on an article page
      const articleMatch = pathname.match(/\/article\/([^\/]+)/);
      if (articleMatch) {
        const articleId = articleMatch[1];

        // Clear previous timeout
        if (trackingTimeout.current) {
          clearTimeout(trackingTimeout.current);
        }

        // Debounce tracking để tránh duplicate
        trackingTimeout.current = setTimeout(() => {
          trackEvent({
            eventType: 'ARTICLE_VIEW',
            entityType: 'article',
            entityId: articleId,
            path: pathname,
            metadata: {
              articleSlug: articleId,
              timestamp: new Date().toISOString()
            }
          });
          lastTrackedPath.current = pathname;
        }, 500); // 500ms debounce
      }
    };

    trackArticleView();

    // Cleanup timeout on unmount
    return () => {
      if (trackingTimeout.current) {
        clearTimeout(trackingTimeout.current);
      }
    };
  }, [pathname, trackEvent]);

  // Track clicks on products (merged with PRODUCT_VIEW)
  useEffect(() => {
    const handleProductClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const productLink = target.closest('a[href*="/product/"]') as HTMLAnchorElement;

      if (productLink) {
        const href = productLink.getAttribute('href');
        // Match format: /product/slug-productId
        const productMatch = href?.match(/\/product\/(.+)-([a-f0-9]{24})$/);

        if (productMatch) {
          const fullSlug = productMatch[1];
          const productId = productMatch[2]; // Extract actual MongoDB ObjectId

          // Use PRODUCT_VIEW instead of PRODUCT_CLICK to merge events
          trackEvent({
            eventType: 'PRODUCT_VIEW',
            entityType: 'product',
            entityId: productId, // Use actual product ID
            path: pathname || '/',
            metadata: {
              productSlug: fullSlug,
              productId: productId,
              targetUrl: href,
              clickedFrom: pathname,
              interactionType: 'click', // Distinguish from page view
              timestamp: new Date().toISOString()
            }
          });
        }
      }
    };

    document.addEventListener('click', handleProductClick);
    return () => document.removeEventListener('click', handleProductClick);
  }, [pathname, trackEvent]);

  // Track search events
  useEffect(() => {
    const handleSearch = (event: Event) => {
      const target = event.target as HTMLInputElement;

      // Check if it's a search input
      if (
        target.type === 'search' ||
        target.name === 'search' ||
        target.placeholder?.toLowerCase().includes('tìm kiếm') ||
        target.placeholder?.toLowerCase().includes('search')
      ) {
        const searchTerm = target.value.trim();
        if (searchTerm.length > 2) {
          // Only track meaningful searches
          trackEvent({
            eventType: 'SEARCH',
            path: pathname || '/',
            metadata: {
              searchTerm,
              searchFrom: pathname,
              timestamp: new Date().toISOString()
            }
          });
        }
      }
    };

    // Track on Enter key or form submit
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        handleSearch(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('submit', handleSearch);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('submit', handleSearch);
    };
  }, [pathname, trackEvent]);

  return <>{children}</>;
};

export default AnalyticsTracker;
