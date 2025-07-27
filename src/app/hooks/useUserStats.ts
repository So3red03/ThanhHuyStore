import { useState, useEffect } from 'react';
import axios from 'axios';

interface UserStats {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    createAt: string;
    lastLogin: string | null;
    emailVerified: string | null;
  };
  orders: {
    total: number;
    totalSpent: number;
    recent: Array<{
      id: string;
      status: string;
      amount: number;
      createdAt: string;
    }>;
  };
  reviews: {
    total: number;
  };
  customerType: string;
  summary: {
    joinDate: string;
    lastActive: string;
    isActive: boolean;
  };
}

export function useUserStats(userId: string | null) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setStats(null);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`/api/users/${userId}/stats`);
        setStats(response.data);
      } catch (err: any) {
        console.error('Error fetching user stats:', err);
        setError(err.response?.data?.error || 'Failed to fetch user stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  return { stats, loading, error };
}
