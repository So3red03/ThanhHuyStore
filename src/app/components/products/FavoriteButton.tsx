'use client';

import React, { useState, useEffect } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { MdFavorite, MdFavoriteBorder } from 'react-icons/md';
import { useFavorites } from '@/app/hooks/useFavorites';
import axios from 'axios';

interface FavoriteButtonProps {
  productId: string;
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
  className?: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  productId,
  size = 'medium',
  showTooltip = true,
  className = ''
}) => {
  const { toggleFavorite } = useFavorites();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  // Kiểm tra trạng thái yêu thích của sản phẩm
  const checkFavoriteStatus = async () => {
    try {
      const response = await axios.get(`/api/user/favorites/${productId}`);
      setIsFavorite(response.data.isFavorite);
    } catch (error) {
      // Nếu user chưa đăng nhập hoặc lỗi, mặc định là false
      setIsFavorite(false);
    }
  };

  // Handle click favorite button
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading) return;

    try {
      setLoading(true);
      await toggleFavorite(productId);
      // Toggle local state
      setIsFavorite(!isFavorite);
    } catch (error) {
      // Error đã được handle trong useFavorites
    } finally {
      setLoading(false);
    }
  };

  // Load trạng thái yêu thích khi component mount
  useEffect(() => {
    checkFavoriteStatus();
  }, [productId]);

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'large':
        return 32;
      default:
        return 24;
    }
  };

  const button = (
    <IconButton
      onClick={handleToggleFavorite}
      disabled={loading}
      size={size}
      className={`transition-all duration-200 ${className}`}
      sx={{
        color: isFavorite ? '#ef4444' : '#6b7280',
        '&:hover': {
          color: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          transform: 'scale(1.1)'
        },
        '&:disabled': {
          opacity: 0.6
        }
      }}
    >
      {isFavorite ? (
        <MdFavorite size={getIconSize()} />
      ) : (
        <MdFavoriteBorder size={getIconSize()} />
      )}
    </IconButton>
  );

  if (showTooltip) {
    return (
      <Tooltip 
        title={isFavorite ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
        placement="top"
      >
        {button}
      </Tooltip>
    );
  }

  return button;
};

export default FavoriteButton;
