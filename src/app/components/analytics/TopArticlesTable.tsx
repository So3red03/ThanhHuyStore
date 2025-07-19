'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDate } from '@/app/(home)/account/orders/OrdersClient';
import { Card, CardContent, Typography, Box, Chip, Avatar } from '@mui/material';
import { MdRemoveRedEye, MdEdit, MdArticle, MdTrendingUp } from 'react-icons/md';
import moment from 'moment';

interface Article {
  id: string;
  title: string;
  category: string;
  image: string;
  views: number;
  originalViews: number;
  createdAt: string;
  updatedAt: string;
}

interface TopArticlesTableProps {
  articles: Article[];
  title: string;
}

const TopArticlesTable: React.FC<TopArticlesTableProps> = ({ articles, title }) => {
  const topArticles = articles.slice(0, 10); // Limit to top 10

  return (
    <Card sx={{ borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <CardContent sx={{ p: 0 }}>
        {/* Header Section */}
        <div className='bg-gradient-to-r from-green-600 via-green-700 to-teal-600 p-4 text-white'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-white/20 backdrop-blur-sm rounded-lg'>
              <MdArticle size={24} className='text-white' />
            </div>
            <div>
              <Typography variant='h6' sx={{ fontWeight: 700, color: 'white' }}>
                {title}
              </Typography>
              <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Top {topArticles.length} bài viết có lượt xem cao nhất
              </Typography>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='p-4'>
          {topArticles.length > 0 ? (
            <div className='space-y-3'>
              {topArticles.map((article, index) => (
                <div
                  key={article.id}
                  className='flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
                >
                  <div className='flex items-center gap-3'>
                    {/* Rank */}
                    <div className='flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full font-bold text-sm'>
                      {index + 1}
                    </div>

                    {/* Article Image */}
                    <div className='relative w-16 h-12 rounded-lg overflow-hidden bg-gray-200'>
                      <Image
                        src={article.image || '/images/placeholder.jpg'}
                        alt={article.title}
                        fill
                        className='object-cover'
                      />
                    </div>

                    {/* Article Info */}
                    <div className='flex-1'>
                      <Typography variant='body1' sx={{ fontWeight: 600, color: '#1f2937', lineHeight: 1.3 }}>
                        {article.title}
                      </Typography>
                      <div className='flex items-center gap-2 mt-1'>
                        <Chip
                          label={article.category}
                          size='small'
                          sx={{
                            backgroundColor: '#f3f4f6',
                            color: '#6b7280',
                            fontSize: '0.75rem',
                            height: 20
                          }}
                        />
                        <Typography variant='caption' color='textSecondary'>
                          {moment(article.createdAt).format('DD/MM/YYYY')}
                        </Typography>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className='text-right'>
                    <div className='flex items-center gap-2 mb-1'>
                      <MdRemoveRedEye size={16} className='text-green-600' />
                      <Typography variant='body1' sx={{ fontWeight: 700, color: '#059669' }}>
                        {article.views.toLocaleString()}
                      </Typography>
                    </div>
                    <Link href={`/article/${article.id}`} target='_blank'>
                      <Chip
                        icon={<MdRemoveRedEye size={14} />}
                        label='Xem'
                        size='small'
                        clickable
                        sx={{
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                          fontSize: '0.75rem',
                          height: 20,
                          '& .MuiChip-icon': {
                            fontSize: '14px'
                          },
                          '&:hover': {
                            backgroundColor: '#bfdbfe'
                          }
                        }}
                      />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-8 text-gray-500'>
              <MdArticle size={48} className='mb-2 opacity-50' />
              <Typography variant='h6' color='textSecondary'>
                Không có dữ liệu
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                Chưa có bài viết nào được xem
              </Typography>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
export default TopArticlesTable;
