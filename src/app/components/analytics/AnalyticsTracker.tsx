'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAnalyticsTracker } from '@/app/hooks/useAnalytics';

interface AnalyticsTrackerProps {
  children: React.ReactNode;
}

const AnalyticsTracker: React.FC<AnalyticsTrackerProps> = ({ children }) => {
  const pathname = usePathname();
  const { trackEvent } = useAnalyticsTracker();

  // Track page views
  useEffect(() => {
    const trackPageView = () => {
      if (!pathname) return;

      trackEvent({
        eventType: 'PAGE_VIEW',
        path: pathname,
        referrer: document.referrer || undefined,
        metadata: {
          title: document.title,
          timestamp: new Date().toISOString()
        }
      });
    };

    // Track immediately
    trackPageView();

    // Track on pathname change
    const handleRouteChange = () => {
      setTimeout(trackPageView, 100); // Small delay to ensure page is loaded
    };

    // Listen for route changes (for client-side navigation)
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [pathname, trackEvent]);

  // Track product views
  useEffect(() => {
    const trackProductView = () => {
      if (!pathname) return;

      // Check if we're on a product page - format: /product/slug-productId
      const productMatch = pathname.match(/\/product\/(.+)-([a-f0-9]{24})$/);
      if (productMatch) {
        const fullSlug = productMatch[1];
        const productId = productMatch[2]; // Extract actual MongoDB ObjectId

        console.log('🔍 Tracking product view:', { fullSlug, productId, pathname });

        trackEvent({
          eventType: 'PRODUCT_VIEW',
          entityType: 'product',
          entityId: productId, // Use actual product ID
          path: pathname,
          metadata: {
            productSlug: fullSlug,
            productId: productId,
            fullPath: pathname,
            timestamp: new Date().toISOString()
          }
        });
      }
    };

    trackProductView();
  }, [pathname, trackEvent]);

  // Track article views
  useEffect(() => {
    const trackArticleView = () => {
      if (!pathname) return;

      // Check if we're on an article page
      const articleMatch = pathname.match(/\/article\/([^\/]+)/);
      if (articleMatch) {
        const articleId = articleMatch[1];
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
      }
    };

    trackArticleView();
  }, [pathname, trackEvent]);

  // Track clicks on products
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

          console.log('🖱️ Tracking product click:', { fullSlug, productId, href, clickedFrom: pathname });

          trackEvent({
            eventType: 'PRODUCT_CLICK',
            entityType: 'product',
            entityId: productId, // Use actual product ID
            path: pathname || '/',
            metadata: {
              productSlug: fullSlug,
              productId: productId,
              targetUrl: href,
              clickedFrom: pathname,
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
