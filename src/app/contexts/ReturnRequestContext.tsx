'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface ReturnRequest {
  id: string;
  orderId: string;
  type: 'RETURN' | 'EXCHANGE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  reason: string;
  description?: string;
  refundAmount?: number;
  additionalCost?: number;
  adminNotes?: string;
  exchangeOrderId?: string;
  createdAt: string;
  items: any[];
  order: {
    id: string;
    amount: number;
    createdAt: string;
  };
}

interface ReturnRequestContextType {
  returnRequests: ReturnRequest[];
  isLoading: boolean;
  refreshReturnRequests: () => Promise<void>;
  getReturnRequestsForOrder: (orderId: string) => ReturnRequest[];
}

const ReturnRequestContext = createContext<ReturnRequestContextType | undefined>(undefined);

export const useReturnRequests = () => {
  const context = useContext(ReturnRequestContext);
  if (context === undefined) {
    throw new Error('useReturnRequests must be used within a ReturnRequestProvider');
  }
  return context;
};

interface ReturnRequestProviderProps {
  children: React.ReactNode;
}

export const ReturnRequestProvider: React.FC<ReturnRequestProviderProps> = ({ children }) => {
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReturnRequests = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/orders/return-request');
      setReturnRequests(response.data.returnRequests || []);
      console.log(`📦 [RETURN-CONTEXT] Fetched ${response.data.returnRequests?.length || 0} return requests`);
    } catch (error) {
      console.error('Error fetching return requests:', error);
      setReturnRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshReturnRequests = async () => {
    await fetchReturnRequests();
  };

  const getReturnRequestsForOrder = (orderId: string): ReturnRequest[] => {
    return returnRequests.filter(request => request.orderId === orderId);
  };

  useEffect(() => {
    fetchReturnRequests();
  }, []);

  const value: ReturnRequestContextType = {
    returnRequests,
    isLoading,
    refreshReturnRequests,
    getReturnRequestsForOrder
  };

  return <ReturnRequestContext.Provider value={value}>{children}</ReturnRequestContext.Provider>;
};
