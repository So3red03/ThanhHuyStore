'use client';

import React, { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { MdFavorite, MdFavoriteBorder } from 'react-icons/md';
import { useFavorites } from '@/app/providers/FavoritesContext';

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
  const { toggleFavorite, isFavorite } = useFavorites();
  const [loading, setLoading] = useState(false);

  // Sử dụng isFavorite function từ useFavorites hook thay vì API call riêng
  const isProductFavorite = isFavorite(productId);

  // Handle click favorite button
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    try {
      setLoading(true);
      await toggleFavorite(productId);
    } catch (error) {
      // Error đã được handle trong useFavorites
    } finally {
      setLoading(false);
    }
  };

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
        color: isProductFavorite ? '#ef4444' : '#6b7280',
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
      {isProductFavorite ? <MdFavorite size={getIconSize()} /> : <MdFavoriteBorder size={getIconSize()} />}
    </IconButton>
  );

  if (showTooltip) {
    return (
      <Tooltip title={isProductFavorite ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'} placement='top'>
        {button}
      </Tooltip>
    );
  }

  return button;
};

export default FavoriteButton;
