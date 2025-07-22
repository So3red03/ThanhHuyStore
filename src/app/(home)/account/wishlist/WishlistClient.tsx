'use client';

import React from 'react';
import { Typography, Button } from '@mui/material';
import { MdFavorite } from 'react-icons/md';
import { useFavorites } from '@/app/hooks/useFavorites';
import ProductCard from '@/app/components/products/ProductCard';
import Heading from '@/app/components/Heading';
import { useRouter } from 'next/navigation';

interface WishlistClientProps {
  currentUser: any;
}

const WishlistClient: React.FC<WishlistClientProps> = ({ currentUser }) => {
  const { favorites, favoriteCount, loading, refreshFavorites } = useFavorites();
  const router = useRouter();

  if (loading) {
    return (
      <div className='px-6'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 rounded w-64 mb-6'></div>
          <div className='grid grid-cols-2 sm:grid-cols-3 xl:!grid-cols-4 gap-8 mt-8'>
            {[...Array(8)].map((_, index) => (
              <div key={index} className='bg-gray-200 h-64 rounded'></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='px-6'>
      {favorites.length > 0 ? (
        <>
          <Heading title='SẢN PHẨM YÊU THÍCH'>
            <></>
          </Heading>

          {/* Products Grid using ProductCard */}
          <div className='grid grid-cols-2 sm:grid-cols-3 xl:!grid-cols-4 gap-8 mt-8'>
            {favorites.map((product: any) => (
              <ProductCard key={product.id} data={product} />
            ))}
          </div>

          {/* Refresh Button */}
          <div className='text-center mt-8'>
            <Button
              variant='outlined'
              onClick={refreshFavorites}
              disabled={loading}
              sx={{
                borderColor: '#3b82f6',
                color: '#3b82f6',
                '&:hover': {
                  borderColor: '#2563eb',
                  backgroundColor: '#eff6ff'
                },
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Làm mới danh sách
            </Button>
          </div>
        </>
      ) : (
        /* Empty State */
        <div className='text-center py-16'>
          <MdFavorite size={80} className='text-gray-300 mx-auto mb-4' />
          <Typography variant='h5' gutterBottom color='text.secondary'>
            Danh sách yêu thích trống
          </Typography>
          <Typography variant='body1' color='text.secondary' className='mb-6'>
            Hãy thêm những sản phẩm bạn yêu thích để dễ dàng tìm lại sau này
          </Typography>
          <Button
            variant='contained'
            size='large'
            onClick={() => router.push('/products')}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' },
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Khám phá sản phẩm
          </Button>
        </div>
      )}
    </div>
  );
};

export default WishlistClient;
