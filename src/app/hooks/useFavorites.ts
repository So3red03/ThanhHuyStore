'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  description: string;
  price?: number;
  thumbnail?: string;
  category: {
    id: string;
    name: string;
  };
  averageRating: number;
  reviewCount: number;
  variants?: Array<{
    id: string;
    price: number;
    stock: number;
  }>;
}

interface UseFavoritesReturn {
  favorites: Product[];
  favoriteCount: number;
  loading: boolean;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

export const useFavorites = (): UseFavoritesReturn => {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Lấy danh sách yêu thích
  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/user/favorites');
      setFavorites(response.data.favorites || []);
      setFavoriteCount(response.data.count || 0);
    } catch (error: any) {
      if (error.response?.status === 401) {
        // User chưa đăng nhập
        setFavorites([]);
        setFavoriteCount(0);
      } else {
        console.error('Error fetching favorites:', error);
        toast.error('Lỗi khi tải danh sách yêu thích');
      }
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra sản phẩm có trong danh sách yêu thích không
  const isFavorite = (productId: string): boolean => {
    return favorites.some(product => product.id === productId);
  };

  // Thêm/xóa sản phẩm khỏi danh sách yêu thích
  const toggleFavorite = async (productId: string): Promise<void> => {
    try {
      const isCurrentlyFavorite = isFavorite(productId);
      const action = isCurrentlyFavorite ? 'remove' : 'add';

      const response = await axios.post('/api/user/favorites', {
        productId,
        action
      });

      if (response.data.isFavorite) {
        toast.success('Đã thêm vào danh sách yêu thích');
      } else {
        toast.success('Đã xóa khỏi danh sách yêu thích');
      }

      // Refresh danh sách yêu thích
      await fetchFavorites();
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Vui lòng đăng nhập để sử dụng tính năng này');
        router.push('/login');
      } else if (error.response?.status === 404) {
        toast.error('Sản phẩm không tồn tại');
      } else {
        console.error('Error toggling favorite:', error);
        toast.error('Có lỗi xảy ra, vui lòng thử lại');
      }
    }
  };

  // Refresh danh sách yêu thích
  const refreshFavorites = async (): Promise<void> => {
    await fetchFavorites();
  };

  // Load danh sách yêu thích khi component mount
  useEffect(() => {
    fetchFavorites();
  }, []);

  return {
    favorites,
    favoriteCount,
    loading,
    isFavorite,
    toggleFavorite,
    refreshFavorites
  };
};
