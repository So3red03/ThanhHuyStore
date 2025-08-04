'use client';

import React from 'react';
import Image from 'next/image';
import { formatPrice } from '../../utils/formatPrice';
import { Card, CardContent, Typography, Box, Chip, Avatar } from '@mui/material';
import { MdTrendingUp, MdVisibility, MdInventory, MdAttachMoney } from 'react-icons/md';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  views?: number;
  clicks?: number;
  inStock: number;
}

interface TopProductsTableProps {
  products: Product[];
  type: 'views' | 'clicks';
  title: string;
}

const TopProductsTable: React.FC<TopProductsTableProps> = ({ products, type, title }) => {
  const topProducts = products.slice(0, 10); // Limit to top 10

  return (
    <Card sx={{ borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <CardContent sx={{ p: 0 }}>
        {/* Header Section */}
        <div className='bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 p-4 text-white'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-white/20 backdrop-blur-sm rounded-lg'>
              {type === 'views' ? (
                <MdVisibility size={24} className='text-white' />
              ) : (
                <MdTrendingUp size={24} className='text-white' />
              )}
            </div>
            <div>
              <Typography variant='h6' sx={{ fontWeight: 700, color: 'white' }}>
                {title}
              </Typography>
              <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Top {topProducts.length} sản phẩm có {type === 'views' ? 'lượt xem' : 'lượt click'} cao nhất
              </Typography>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='p-4'>
          {topProducts.length > 0 ? (
            <div className='space-y-3'>
              {topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className='flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
                >
                  <div className='flex items-center gap-3'>
                    {/* Rank */}
                    <div className='flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm'>
                      {index + 1}
                    </div>

                    {/* Product Image */}
                    <div className='relative w-12 h-12 rounded-lg overflow-hidden bg-gray-200'>
                      <Image
                        src={product.image || '/images/placeholder.jpg'}
                        alt={product.name}
                        fill
                        className='object-cover'
                      />
                    </div>

                    {/* Product Info */}
                    <div>
                      <Typography variant='body1' sx={{ fontWeight: 600, color: '#1f2937' }}>
                        {product.name}
                      </Typography>
                      <div className='flex items-center gap-2 mt-1'>
                        <Chip
                          label={product.category}
                          size='small'
                          sx={{
                            backgroundColor: '#f3f4f6',
                            color: '#6b7280',
                            fontSize: '0.75rem',
                            height: 20
                          }}
                        />
                        <Typography variant='caption' color='textSecondary'>
                          {formatPrice(product.price)}
                        </Typography>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className='text-right'>
                    <div className='flex items-center gap-2 mb-1'>
                      {type === 'views' ? (
                        <MdVisibility size={16} className='text-blue-600' />
                      ) : (
                        <MdTrendingUp size={16} className='text-green-600' />
                      )}
                      <Typography
                        variant='body1'
                        sx={{ fontWeight: 700, color: type === 'views' ? '#2563eb' : '#059669' }}
                      >
                        {((type === 'views' ? product.views : product.clicks) || 0).toLocaleString()}
                      </Typography>
                    </div>

                    <div className='flex items-center gap-2'>
                      <Chip
                        icon={<MdInventory size={14} />}
                        label={`${product.inStock} còn lại`}
                        size='small'
                        sx={{
                          backgroundColor:
                            product.inStock > 10 ? '#dcfce7' : product.inStock > 0 ? '#fef3c7' : '#fee2e2',
                          color: product.inStock > 10 ? '#166534' : product.inStock > 0 ? '#92400e' : '#991b1b',
                          fontSize: '0.75rem',
                          height: 20,
                          '& .MuiChip-icon': {
                            fontSize: '14px'
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-8 text-gray-500'>
              <MdTrendingUp size={48} className='mb-2 opacity-50' />
              <Typography variant='h6' color='textSecondary'>
                Không có dữ liệu
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                Chưa có sản phẩm nào được {type === 'views' ? 'xem' : 'click'}
              </Typography>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopProductsTable;
