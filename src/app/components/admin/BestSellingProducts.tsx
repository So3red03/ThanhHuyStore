'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Box, Chip, Avatar } from '@mui/material';
import { MdTrendingUp, MdShoppingCart, MdInventory, MdAttachMoney } from 'react-icons/md';
import { formatPrice } from '../../../../utils/formatPrice';
import Image from 'next/image';

interface BestSellingProductsProps {
  uniqueProducts: any[];
  orders?: any[]; // Add orders to calculate purchase quantities
}

const BestSellingProducts: React.FC<BestSellingProductsProps> = ({ uniqueProducts, orders = [] }) => {
  // 🎯 Calculate purchase quantities for each product
  const enhancedProducts = useMemo(() => {
    return (
      uniqueProducts
        ?.map(product => {
          // Calculate total quantity purchased across all orders
          const totalPurchased = orders.reduce((total, order) => {
            const orderProduct = order.products?.find((p: any) => p.id === product.id);
            return total + (orderProduct?.quantity || 0);
          }, 0);

          // Calculate total revenue for this product
          const totalRevenue = orders.reduce((total, order) => {
            const orderProduct = order.products?.find((p: any) => p.id === product.id);
            return total + (orderProduct?.quantity || 0) * (orderProduct?.price || product.price || 0);
          }, 0);

          return {
            ...product,
            totalPurchased,
            totalRevenue,
            // Use thumbnail field from schema instead of selectedImg
            imageUrl: product.thumbnail || product.selectedImg || '/noavatar.png'
          };
        })
        .sort((a, b) => b.totalPurchased - a.totalPurchased) || []
    ); // Sort by most purchased
  }, [uniqueProducts, orders]);

  if (!enhancedProducts.length) {
    return (
      <Card sx={{ borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <CardContent sx={{ p: 4 }}>
          <div className='flex items-center gap-3 mb-6'>
            <div className='p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl'>
              <MdTrendingUp className='text-white text-xl' />
            </div>
            <Typography variant='h6' sx={{ fontWeight: 700, color: '#1f2937' }}>
              Sản phẩm bán chạy
            </Typography>
          </div>
          <div className='text-center py-8 text-gray-500'>
            <MdInventory className='text-4xl mx-auto mb-4 text-gray-300' />
            <Typography variant='body1' color='textSecondary'>
              Chưa có dữ liệu sản phẩm bán chạy
            </Typography>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
    >
      <CardContent sx={{ p: 0 }}>
        {/* Enhanced Header */}
        <div className='bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-100'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg'>
                <MdTrendingUp className='text-white text-xl' />
              </div>
              <div>
                <Typography variant='h6' sx={{ fontWeight: 700, color: '#1f2937', mb: 0.5 }}>
                  Sản phẩm bán chạy
                </Typography>
                <Typography variant='body2' sx={{ color: '#6b7280' }}>
                  Top {enhancedProducts.length} sản phẩm có doanh số cao nhất
                </Typography>
              </div>
            </div>
            <Chip
              label={`${enhancedProducts.length} sản phẩm`}
              sx={{
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>

        {/* Enhanced Table */}
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='bg-gray-50 border-b border-gray-200'>
                <th className='text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider'>
                  <div className='flex items-center gap-2'>
                    <MdInventory className='text-gray-500' />
                    Sản phẩm
                  </div>
                </th>
                <th className='text-center py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider'>
                  <div className='flex items-center justify-center gap-2'>
                    <MdShoppingCart className='text-gray-500' />
                    Đã mua
                  </div>
                </th>
                <th className='text-center py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider'>
                  Tồn kho
                </th>
                <th className='text-right py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider'>
                  <div className='flex items-center justify-end gap-2'>
                    <MdAttachMoney className='text-gray-500' />
                    Doanh thu
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {enhancedProducts.map((product, index) => (
                <tr key={product.id} className='hover:bg-gray-50 transition-colors duration-200'>
                  {/* Product Info */}
                  <td className='py-4 px-6'>
                    <div className='flex items-center gap-4'>
                      <div className='relative'>
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            border: '2px solid #e5e7eb'
                          }}
                        >
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            width={48}
                            height={48}
                            className='object-cover rounded-xl'
                            onError={e => {
                              e.currentTarget.src = '/noavatar.png';
                            }}
                          />
                        </Avatar>
                        {index < 3 && (
                          <div
                            className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                            }`}
                          >
                            {index + 1}
                          </div>
                        )}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <Typography
                          variant='body1'
                          sx={{
                            fontWeight: 600,
                            color: '#1f2937',
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {product.name}
                        </Typography>
                        <Typography variant='body2' sx={{ color: '#6b7280' }}>
                          ID: {product.id.slice(-8)}
                        </Typography>
                      </div>
                    </div>
                  </td>

                  {/* Total Purchased */}
                  <td className='py-4 px-4 text-center'>
                    <div className='flex flex-col items-center'>
                      <Typography
                        variant='h6'
                        sx={{
                          fontWeight: 700,
                          color: product.totalPurchased > 0 ? '#059669' : '#6b7280',
                          mb: 0.5
                        }}
                      >
                        {product.totalPurchased}
                      </Typography>
                      <Typography variant='caption' sx={{ color: '#9ca3af' }}>
                        đã bán
                      </Typography>
                    </div>
                  </td>

                  {/* Stock */}
                  <td className='py-4 px-4 text-center'>
                    <Chip
                      label={product.inStock || 0}
                      size='small'
                      sx={{
                        backgroundColor:
                          (product.inStock || 0) > 10 ? '#dcfce7' : (product.inStock || 0) > 0 ? '#fef3c7' : '#fee2e2',
                        color:
                          (product.inStock || 0) > 10 ? '#166534' : (product.inStock || 0) > 0 ? '#92400e' : '#dc2626',
                        fontWeight: 600,
                        minWidth: '60px'
                      }}
                    />
                  </td>

                  {/* Revenue */}
                  <td className='py-4 px-6 text-right'>
                    <div className='flex flex-col items-end'>
                      <Typography
                        variant='body1'
                        sx={{
                          fontWeight: 700,
                          color: '#1f2937',
                          mb: 0.5
                        }}
                      >
                        {formatPrice(product.totalRevenue)}
                      </Typography>
                      <Typography variant='caption' sx={{ color: '#6b7280' }}>
                        {formatPrice(product.price || 0)}/sp
                      </Typography>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Enhanced Footer */}
        <div className='bg-gray-50 px-6 py-4 border-t border-gray-200'>
          <div className='flex items-center justify-between text-sm text-gray-600'>
            <div className='flex items-center gap-4'>
              <span>
                Tổng sản phẩm: <strong>{enhancedProducts.length}</strong>
              </span>
              <span>•</span>
              <span>
                Tổng đã bán: <strong>{enhancedProducts.reduce((sum, p) => sum + p.totalPurchased, 0)}</strong>
              </span>
            </div>
            <div className='text-right'>
              <span>Tổng doanh thu: </span>
              <strong className='text-green-600'>
                {formatPrice(enhancedProducts.reduce((sum, p) => sum + p.totalRevenue, 0))}
              </strong>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BestSellingProducts;
