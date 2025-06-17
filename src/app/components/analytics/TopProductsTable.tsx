'use client';

import Image from 'next/image';
import { formatPrice } from '../../../../utils/formatPrice';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

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
  const rows = products.map((product, index) => ({
    id: product.id,
    rank: index + 1,
    name: product.name,
    category: product.category,
    price: product.price,
    image: product.image,
    count: type === 'views' ? product.views : product.clicks,
    inStock: product.inStock
  }));

  const columns: GridColDef[] = [
    {
      field: 'rank',
      headerName: '#',
      width: 50,
      renderCell: params => <div className='font-semibold text-gray-600'>#{params.value}</div>
    },
    {
      field: 'name',
      headerName: 'Sản phẩm',
      width: 250,
      renderCell: params => (
        <div className='flex items-center gap-3'>
          <div className='flex-shrink-0 h-10 w-10'>
            {params.row.image ? (
              <Image
                src={params.row.image}
                alt={params.row.name}
                width={40}
                height={40}
                className='h-10 w-10 rounded-lg object-cover'
              />
            ) : (
              <div className='h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center'>
                <span className='text-gray-400 text-xs'>No img</span>
              </div>
            )}
          </div>
          <div className='text-sm font-medium text-gray-900 truncate'>{params.row.name}</div>
        </div>
      )
    },
    {
      field: 'category',
      headerName: 'Danh mục',
      width: 120,
      renderCell: params => (
        <span className='inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full'>
          {params.value}
        </span>
      )
    },
    {
      field: 'price',
      headerName: 'Giá',
      width: 120,
      renderCell: params => <div className='font-medium text-gray-900'>{formatPrice(params.value)}</div>
    },
    {
      field: 'count',
      headerName: type === 'views' ? 'Lượt xem' : 'Lượt click',
      width: 100,
      renderCell: params => <div className='font-semibold text-blue-600'>{params.value?.toLocaleString() || 0}</div>
    },
    {
      field: 'inStock',
      headerName: 'Tồn kho',
      width: 100,
      renderCell: params => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            params.value > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {params.value > 0 ? `${params.value}` : 'Hết hàng'}
        </span>
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

      {products.length === 0 && (
        <div className='text-center py-8'>
          <p className='text-gray-500'>Không có dữ liệu</p>
        </div>
      )}
    </div>
  );
};

export default TopProductsTable;
