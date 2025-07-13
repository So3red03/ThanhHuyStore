'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface AnalyticsOverview {
  totalEvents: number;
  pageViews: number;
  uniqueVisitors: number;
  productViews: number;
  articleViews: number;
  searches: number;
  purchases: number;
}

interface TrendData {
  date: string;
  count: number;
}

interface AnalyticsData {
  overview: AnalyticsOverview;
  trends: TrendData[];
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
}

interface ProductAnalytics {
  topViewedProducts: any[];
  categoryPerformance: any[];
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
}

interface ArticleAnalytics {
  topArticles: any[];
  categoryViews: any[];
  articleTrends: TrendData[];
  summary: {
    totalViews: number;
    uniqueReaders: number;
    averageViewsPerReader: string;
  };
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
}

export const useAnalyticsOverview = (days: number = 7) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/analytics/overview?days=${days}`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch analytics data');
      console.error('Analytics overview error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days]);

  return { data, loading, error, refetch: fetchData };
};

export const useProductAnalytics = (days: number = 7, limit: number = 10) => {
  const [data, setData] = useState<ProductAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/analytics/products?days=${days}&limit=${limit}`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch product analytics');
      console.error('Product analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days, limit]);

  return { data, loading, error, refetch: fetchData };
};

export const useArticleAnalytics = (days: number = 7, limit: number = 10) => {
  const [data, setData] = useState<ArticleAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/analytics/articles?days=${days}&limit=${limit}`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch article analytics');
      console.error('Article analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days, limit]);

  return { data, loading, error, refetch: fetchData };
};

export const usePaymentMethodAnalytics = (days: number = 7) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/analytics/payment-methods?days=${days}`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch payment method analytics');
      console.error('Payment method analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days]);

  return { data, loading, error, refetch: fetchData };
};

export const useVoucherAnalytics = (days: number = 7) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/analytics/vouchers?days=${days}`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch voucher analytics');
      console.error('Voucher analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days]);

  return { data, loading, error, refetch: fetchData };
};

// Keep the old name for backward compatibility
export const usePromotionAnalytics = useVoucherAnalytics;

// Get session timeout from admin settings
const getSessionTimeout = async (): Promise<number> => {
  try {
    const response = await fetch('/api/admin/settings/public');
    const data = await response.json();
    return data.sessionTimeout || 30;
  } catch (error) {
    return 30; // Default 30 minutes
  }
};

// Utility function to get or create session ID with configurable expiry
const getSessionId = async (): Promise<string> => {
  if (typeof window === 'undefined') return '';

  const sessionData = localStorage.getItem('analytics_session_data');
  const now = Date.now();
  const sessionTimeout = await getSessionTimeout();

  if (sessionData) {
    try {
      const { sessionId, timestamp } = JSON.parse(sessionData);
      // Session expires based on admin settings
      if (now - timestamp < sessionTimeout * 60 * 1000) {
        // Update timestamp for activity
        localStorage.setItem(
          'analytics_session_data',
          JSON.stringify({
            sessionId,
            timestamp: now
          })
        );
        return sessionId;
      }
    } catch (error) {
      // Invalid session data, create new
    }
  }

  // Create new session
  const newSessionId = `session_${now}_${Math.random().toString(36).substring(2, 11)}`;
  localStorage.setItem(
    'analytics_session_data',
    JSON.stringify({
      sessionId: newSessionId,
      timestamp: now
    })
  );

  return newSessionId;
};

// Base tracking function
const trackEvent = async (eventData: {
  eventType: string;
  entityType?: string;
  entityId?: string;
  metadata?: any;
  path?: string;
  referrer?: string;
}) => {
  try {
    const sessionId = await getSessionId();
    await axios.post('/api/analytics/track', {
      ...eventData,
      sessionId,
      path: eventData.path || (typeof window !== 'undefined' ? window.location.pathname : '/'),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Failed to track ${eventData.eventType}:`, error);
  }
};

// Purchase tracking removed - simplified analytics system

// Helper function to track product interactions (unified as PRODUCT_VIEW)
export const trackProductInteraction = async (productId: string, additionalData?: any) => {
  await trackEvent({
    eventType: 'PRODUCT_VIEW', // Always use PRODUCT_VIEW (merged PRODUCT_CLICK)
    entityType: 'product',
    entityId: productId,
    metadata: {
      productId,
      ...additionalData,
      timestamp: new Date().toISOString()
    }
  });
};

// Helper function to track search events
export const trackSearch = async (searchTerm: string, resultCount?: number, additionalData?: any) => {
  await trackEvent({
    eventType: 'SEARCH',
    metadata: {
      searchTerm,
      resultCount,
      searchQuery: searchTerm, // For better analytics
      hasResults: resultCount !== undefined && resultCount > 0,
      ...additionalData,
      timestamp: new Date().toISOString()
    }
  });
};

// Helper function to track article interactions
export const trackArticleView = async (articleId: string, additionalData?: any) => {
  await trackEvent({
    eventType: 'ARTICLE_VIEW',
    entityType: 'article',
    entityId: articleId,
    metadata: {
      articleId,
      ...additionalData,
      timestamp: new Date().toISOString()
    }
  });
};

// Hook để track events
export const useAnalyticsTracker = () => {
  return {
    trackEvent,
    trackProductInteraction,
    trackSearch,
    trackArticleView
  };
};
