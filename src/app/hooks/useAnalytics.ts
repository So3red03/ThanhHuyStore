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
  topClickedProducts: any[];
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

export const usePromotionAnalytics = (days: number = 7) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/analytics/promotions?days=${days}`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch promotion analytics');
      console.error('Promotion analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days]);

  return { data, loading, error, refetch: fetchData };
};

// Utility function to get or create session ID
const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';

  let sessionId = localStorage.getItem('analytics_session_id') || '';
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
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
    await axios.post('/api/analytics/track', {
      ...eventData,
      sessionId: getSessionId(),
      path: eventData.path || (typeof window !== 'undefined' ? window.location.pathname : '/'),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Failed to track ${eventData.eventType}:`, error);
  }
};

// Helper function to track purchase events
export const trackPurchase = async (orderId: string, userId?: string, orderData?: any) => {
  await trackEvent({
    eventType: 'PURCHASE',
    entityType: 'order',
    entityId: orderId,
    path: '/checkout',
    metadata: {
      orderId,
      userId,
      amount: orderData?.amount,
      currency: orderData?.currency || 'VND',
      products: orderData?.products || [],
      timestamp: new Date().toISOString()
    }
  });
};

// Helper function to track product interactions
export const trackProductInteraction = async (
  eventType: 'PRODUCT_VIEW' | 'PRODUCT_CLICK',
  productId: string,
  additionalData?: any
) => {
  await trackEvent({
    eventType,
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
    trackPurchase,
    trackProductInteraction,
    trackSearch,
    trackArticleView
  };
};
