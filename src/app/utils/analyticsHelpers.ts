import axios from 'axios';

// Helper function to track purchase events
export const trackPurchase = async (orderId: string, userId?: string, orderData?: any) => {
  try {
    // Generate session ID if not exists
    let sessionId = '';
    if (typeof window !== 'undefined') {
      sessionId = localStorage.getItem('analytics_session_id') || '';
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('analytics_session_id', sessionId);
      }
    }

    await axios.post('/api/analytics/track', {
      eventType: 'PURCHASE',
      entityType: 'order',
      entityId: orderId,
      sessionId,
      path: window?.location?.pathname || '/checkout',
      metadata: {
        orderId,
        userId,
        amount: orderData?.amount,
        currency: orderData?.currency || 'VND',
        products: orderData?.products || [],
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to track purchase:', error);
  }
};

// Helper function to track product interactions
export const trackProductInteraction = async (
  eventType: 'PRODUCT_VIEW' | 'PRODUCT_CLICK',
  productId: string,
  additionalData?: any
) => {
  try {
    let sessionId = '';
    if (typeof window !== 'undefined') {
      sessionId = localStorage.getItem('analytics_session_id') || '';
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('analytics_session_id', sessionId);
      }
    }

    await axios.post('/api/analytics/track', {
      eventType,
      entityType: 'product',
      entityId: productId,
      sessionId,
      path: window?.location?.pathname || '/',
      metadata: {
        productId,
        ...additionalData,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`Failed to track ${eventType}:`, error);
  }
};

// Helper function to track search events
export const trackSearch = async (searchTerm: string, resultCount?: number) => {
  try {
    let sessionId = '';
    if (typeof window !== 'undefined') {
      sessionId = localStorage.getItem('analytics_session_id') || '';
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('analytics_session_id', sessionId);
      }
    }

    await axios.post('/api/analytics/track', {
      eventType: 'SEARCH',
      sessionId,
      path: window?.location?.pathname || '/',
      metadata: {
        searchTerm,
        resultCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to track search:', error);
  }
};

// Helper function to track article interactions
export const trackArticleView = async (articleId: string, additionalData?: any) => {
  try {
    let sessionId = '';
    if (typeof window !== 'undefined') {
      sessionId = localStorage.getItem('analytics_session_id') || '';
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('analytics_session_id', sessionId);
      }
    }

    await axios.post('/api/analytics/track', {
      eventType: 'ARTICLE_VIEW',
      entityType: 'article',
      entityId: articleId,
      sessionId,
      path: window?.location?.pathname || '/',
      metadata: {
        articleId,
        ...additionalData,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to track article view:', error);
  }
};
