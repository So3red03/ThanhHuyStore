'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatDate } from '@/app/(home)/account/orders/OrdersClient';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { MdRemoveRedEye, MdEdit } from 'react-icons/md';
import { IconButton } from '@mui/material';

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
  const rows = articles.map((article, index) => ({
    id: article.id,
    rank: index + 1,
    title: article.title,
    category: article.category,
    image: article.image,
    views: article.views,
    originalViews: article.originalViews,
    createdAt: article.createdAt
  }));

  const columns: GridColDef[] = [
    {
      field: 'rank',
      headerName: '#',
      width: 50,
      renderCell: params => <div className='font-semibold text-gray-600'>#{params.value}</div>
    },
    {
      field: 'title',
      headerName: 'Bài viết',
      width: 300,
      renderCell: params => (
        <div className='flex items-center gap-3'>
          <div className='flex-shrink-0 h-12 w-16'>
            {params.row.image ? (
              <Image
                src={params.row.image}
                alt={params.row.title}
                width={64}
                height={48}
                className='h-12 w-16 rounded-lg object-cover'
              />
            ) : (
              <div className='h-12 w-16 rounded-lg bg-gray-200 flex items-center justify-center'>
                <span className='text-gray-400 text-xs'>No img</span>
              </div>
            )}
          </div>
          <div className='text-sm font-medium text-gray-900 line-clamp-2' title={params.row.title}>
            {params.row.title}
          </div>
        </div>
      )
    },
    {
      field: 'category',
      headerName: 'Danh mục',
      width: 120,
      renderCell: params => (
        <span className='inline-flex px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full'>
          {params.value}
        </span>
      )
    },
    {
      field: 'views',
      headerName: 'Analytics Views',
      width: 120,
      renderCell: params => <div className='font-semibold text-blue-600'>{params.value.toLocaleString()}</div>
    },
    {
      field: 'originalViews',
      headerName: 'DB Views',
      width: 100,
      renderCell: params => <div className='font-medium text-gray-600'>{params.value.toLocaleString()}</div>
    },
    {
      field: 'createdAt',
      headerName: 'Ngày tạo',
      width: 120,
      renderCell: params => <div className='text-sm text-gray-500'>{formatDate(params.value)}</div>
    },
    {
      field: 'actions',
      headerName: 'Hành động',
      width: 120,
      renderCell: params => (
        <div className='flex items-center gap-1'>
          <Link href={`/article/${params.row.id}`} target='_blank'>
            <IconButton size='small' color='primary'>
              <MdRemoveRedEye />
            </IconButton>
          </Link>
          <Link href={`/admin/manage-articles`}>
            <IconButton size='small' color='success'>
              <MdEdit />
            </IconButton>
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className='bg-white p-6 rounded-lg border border-gray-200 shadow-sm'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>{title}</h3>

      <div className='h-[400px] w-full'>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 5 }
            }
          }}
          pageSizeOptions={[5, 10]}
          disableRowSelectionOnClick
          disableColumnFilter
          disableDensitySelector
          disableColumnSelector
          hideFooterSelectedRowCount
          sx={{
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#F9FAFB',
              borderBottom: '1px solid #E5E7EB'
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #F3F4F6'
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: '#F9FAFB'
            }
          }}
        />
      </div>

      {articles.length === 0 && (
        <div className='text-center py-8'>
          <p className='text-gray-500'>Không có dữ liệu bài viết</p>
        </div>
      )}
    </div>
  );
};

export default TopArticlesTable;
