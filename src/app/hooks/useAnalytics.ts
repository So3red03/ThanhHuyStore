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

// Hook để track events
export const useAnalyticsTracker = () => {
  const trackEvent = async (eventData: {
    eventType: string;
    entityType?: string;
    entityId?: string;
    metadata?: any;
    path: string;
    referrer?: string;
  }) => {
    try {
      // Generate session ID if not exists
      let sessionId = localStorage.getItem('analytics_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('analytics_session_id', sessionId);
      }

      await axios.post('/api/analytics/track', {
        ...eventData,
        sessionId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  };

  return { trackEvent };
};
