'use client';

import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { formatPrice } from '../../../../../utils/formatPrice';
import { formatDate } from '@/app/(home)/account/orders/OrdersClient';
import ActionBtn from '@/app/components/ActionBtn';
import { MdDelete, MdEdit, MdClose, MdCheck, MdAdd, MdRefresh, MdFilterList, MdSearch } from 'react-icons/md';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Status from '@/app/components/Status';
import NullData from '@/app/components/NullData';
import ConfirmDialog from '@/app/components/ConfirmDialog';
import AddPromotionModal from './AddPromotionModal';
import { SafeUser } from '../../../../../types';
import { Button, TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel, Chip, Box } from '@mui/material';

interface ManagePromotionsClientProps {
  promotions: any[];
  products: any[];
  categories: any[];
  currentUser: SafeUser | null | undefined;
}

const ManagePromotionsClient: React.FC<ManagePromotionsClientProps> = ({
  promotions,
  products,
  categories,
  currentUser
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<any>(null);
  const [isDelete, setIsDelete] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editPromotionData, setEditPromotionData] = useState<any>(null);

  // Enhanced search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [filteredPromotions, setFilteredPromotions] = useState(promotions);

  const toggleDelete = () => {
    setIsDelete(!isDelete);
  };

  const toggleAddModal = () => {
    setIsAddModalOpen(!isAddModalOpen);
  };

  // TODO: Remove unused code
  /*
  const toggleEditModal = () => {
    setIsEditModalOpen(!isEditModalOpen);
  };
  */

  const handleOpenEditModal = (promotion: any) => {
    setSelectedPromotion(promotion);

    // Prepare edit data for AddPromotionModal
    setEditPromotionData(promotion);
    setIsAddModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedPromotion) return;

    setIsLoading(true);
    try {
      await axios.delete(`/api/promotion/${selectedPromotion.id}`);
      toast.success('Xóa chiến dịch thành công');
      router.refresh();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xóa');
    } finally {
      setIsLoading(false);
      toggleDelete();
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setIsLoading(true);
    try {
      await axios.put(`/api/promotion/${id}`, { isActive: !currentStatus });
      toast.success(`${!currentStatus ? 'Kích hoạt' : 'Tạm dừng'} chiến dịch thành công`);
      router.refresh();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái chiến dịch');
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced filter logic
  const handleSearch = () => {
    let filtered = promotions;

    // Search by title or description
    if (searchTerm) {
      filtered = filtered.filter(
        promotion =>
          promotion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          promotion.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(promotion => promotion.isActive === isActive);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(promotion => promotion.discountType === typeFilter);
    }

    setFilteredPromotions(filtered);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    router.refresh();
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setFilteredPromotions(promotions);
  };

  let rows: any = [];
  if (filteredPromotions) {
    rows = filteredPromotions.map(promotion => {
      return {
        id: promotion.id,
        title: promotion.title,
        description: promotion.description,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        maxDiscount: promotion.maxDiscount,
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        isActive: promotion.isActive,
        applyToAll: promotion.applyToAll,
        productCount: promotion.products?.length || 0,
        categoryCount: promotion.categories?.length || 0,
        createdAt: promotion.createdAt
      };
    });
  }

  const columns: GridColDef[] = [
    { field: 'title', headerName: 'Tên chiến dịch', width: 200 },
    { field: 'description', headerName: 'Mô tả', width: 200 },
    {
      field: 'discountValue',
      headerName: 'Giá trị',
      width: 60,
      renderCell: params => {
        const isPercentage = params.row.discountType === 'PERCENTAGE';
        return (
          <div className='font-semibold'>
            {isPercentage ? `${params.row.discountValue}%` : formatPrice(params.row.discountValue)}
          </div>
        );
      }
    },
    {
      field: 'scope',
      headerName: 'Phạm vi',
      width: 110,
      renderCell: params => {
        if (params.row.applyToAll) {
          return <Status text='Toàn bộ' bg='bg-blue-200' color='text-blue-700' />;
        }
        return (
          <div className='text-sm'>
            <div>{params.row.productCount} sản phẩm</div>
            <div>{params.row.categoryCount} danh mục</div>
          </div>
        );
      }
    },
    {
      field: 'startDate',
      headerName: 'Bắt đầu',
      width: 125,
      renderCell: params => {
        return <div className='text-sm'>{formatDate(params.row.startDate)}</div>;
      }
    },
    {
      field: 'endDate',
      headerName: 'Kết thúc',
      width: 125,
      renderCell: params => {
        const endDate = new Date(params.row.endDate);
        const now = new Date();
        const isExpired = endDate < now;
        return (
          <div className={`text-sm ${isExpired ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
            {formatDate(params.row.endDate)}
          </div>
        );
      }
    },
    {
      field: 'isActive',
      headerName: 'Trạng thái',
      width: 100,
      renderCell: params => {
        return (
          <div className='flex justify-center items-center h-full'>
            {params.row.isActive ? (
              <Status text='Hoạt động' icon={MdCheck} bg='bg-teal-200' color='text-teal-700' />
            ) : (
              <Status text='Tạm dừng' icon={MdClose} bg='bg-rose-200' color='text-rose-700' />
            )}
          </div>
        );
      }
    },
    {
      field: 'action',
      headerName: 'Thao tác',
      width: 150,
      renderCell: params => {
        return (
          <div className='flex items-center justify-center gap-2 h-full'>
            <ActionBtn icon={MdEdit} onClick={() => handleOpenEditModal(params.row)} />
            <ActionBtn
              icon={params.row.isActive ? MdClose : MdCheck}
              onClick={() => handleToggleStatus(params.row.id, params.row.isActive)}
            />
            <ActionBtn
              icon={MdDelete}
              onClick={() => {
                setSelectedPromotion(params.row);
                toggleDelete();
              }}
            />
          </div>
        );
      }
    }
  ];

  if (!promotions || promotions.length === 0) {
    return (
      <div className='w-[78.5vw] m-auto text-xl mt-6'>
        {/* Header */}
        <div className='px-6 py-5'>
          <div className='flex items-center justify-between mb-6'>
            <div className='flex items-center gap-3'>
              <h1 className='text-3xl font-bold text-gray-800'>Khuyến mãi</h1>
            </div>
            <div className='flex items-center gap-3'>
              <Button
                variant='contained'
                startIcon={<MdAdd />}
                onClick={toggleAddModal}
                size='medium'
                sx={{
                  backgroundColor: '#10b981',
                  '&:hover': {
                    backgroundColor: '#059669'
                  },
                  boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Thêm khuyến mãi
              </Button>
            </div>
          </div>
        </div>

        <div className='px-6'>
          <NullData title='Chưa có chiến dịch nào được tạo' />
        </div>

        <AddPromotionModal
          isOpen={isAddModalOpen}
          toggleOpen={toggleAddModal}
          products={products}
          categories={categories}
        />
      </div>
    );
  }

  return (
    <div className='w-[78.5vw] m-auto text-xl mt-6'>
      {/* Header */}
      <div className='px-6 py-5'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <h1 className='text-3xl font-bold text-gray-800'>Khuyến mãi</h1>
            <Chip
              label={`${filteredPromotions.length} hiện có`}
              size='medium'
              sx={{
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                fontWeight: 600
              }}
            />
          </div>
          <div className='flex items-center gap-3'>
            {/* Manual Refresh */}
            <Button
              variant='contained'
              startIcon={<MdRefresh />}
              onClick={handleRefresh}
              size='medium'
              sx={{
                backgroundColor: '#3b82f6',
                '&:hover': { backgroundColor: '#2563eb' },
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
              }}
            >
              {isLoading ? 'Đang tải...' : 'Làm mới'}
            </Button>
            <Button
              variant='contained'
              startIcon={<MdAdd />}
              onClick={toggleAddModal}
              size='medium'
              sx={{
                backgroundColor: '#10b981',
                '&:hover': {
                  backgroundColor: '#059669'
                },
                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Thêm chiến dịch
            </Button>
          </div>
        </div>

        {/* Enhanced Search Form */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6'>
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
            {/* Search Input */}
            <div className='lg:col-span-2'>
              <label className='block text-sm font-semibold text-gray-700 mb-3'>Tìm kiếm</label>
              <TextField
                size='medium'
                placeholder='Tìm theo tên hoặc mô tả chiến dịch...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                sx={{
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#f9fafb',
                    color: '#111827', // ✅ màu chữ mặc định
                    '& fieldset': {
                      borderColor: '#e5e7eb'
                    },
                    '&:hover fieldset': {
                      borderColor: '#d1d5db'
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#ffffff',
                      color: '#111827', // ✅ giữ màu chữ khi focus
                      '& fieldset': {
                        borderColor: '#3b82f6'
                      }
                    },
                    '& input::placeholder': {
                      color: '#9ca3af', // ✅ màu placeholder (text-gray-400)
                      opacity: 1 // ✅ đảm bảo không bị mờ
                    }
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <Button
                        size='medium'
                        onClick={handleSearch}
                        startIcon={<MdSearch />}
                        variant='contained'
                        sx={{
                          minWidth: 'auto',
                          px: 2,
                          backgroundColor: '#3b82f6',
                          '&:hover': {
                            backgroundColor: '#2563eb'
                          },
                          borderRadius: '6px'
                        }}
                      >
                        Tìm
                      </Button>
                    </InputAdornment>
                  )
                }}
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-3'>Trạng thái</label>
              <FormControl fullWidth size='medium'>
                <Select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: '8px',
                    backgroundColor: '#f9fafb',
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#e5e7eb'
                      },
                      '&:hover fieldset': {
                        borderColor: '#d1d5db'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                        backgroundColor: '#ffffff'
                      }
                    }
                  }}
                >
                  <MenuItem value='all'>Tất cả</MenuItem>
                  <MenuItem value='active'>✅ Hoạt động</MenuItem>
                  <MenuItem value='inactive'>❌ Tạm dừng</MenuItem>
                </Select>
              </FormControl>
            </div>

            {/* Type Filter */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-3'>Loại giảm giá</label>
              <FormControl fullWidth size='medium'>
                <Select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: '8px',
                    backgroundColor: '#f9fafb',
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#e5e7eb'
                      },
                      '&:hover fieldset': {
                        borderColor: '#d1d5db'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                        backgroundColor: '#ffffff'
                      }
                    }
                  }}
                >
                  <MenuItem value='all'>Tất cả</MenuItem>
                  <MenuItem value='PERCENTAGE'>📊 Phần trăm</MenuItem>
                  <MenuItem value='FIXED'>💵 Số tiền cố định</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex justify-between items-center mt-6'>
            {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
              <Button
                variant='outlined'
                onClick={handleClearFilters}
                size='medium'
                startIcon={<MdFilterList />}
                sx={{
                  borderColor: '#ef4444',
                  color: '#ef4444',
                  '&:hover': {
                    borderColor: '#dc2626',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626'
                  }
                }}
              >
                Xóa bộ lọc
              </Button>
            )}

            {/* Search Results Info */}
            {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
              <div className='px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg'>
                <div className='text-sm font-medium text-green-800'>
                  🎯 <strong>Kết quả:</strong> {filteredPromotions.length} chiến dịch
                  {filteredPromotions.length === 0 && (
                    <span className='text-red-600 ml-2'>- Không tìm thấy chiến dịch nào phù hợp</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <div className='px-6'>
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
          <div style={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 9 }
                }
              }}
              pageSizeOptions={[9, 20]}
              checkboxSelection
              disableRowSelectionOnClick
              sx={{
                border: '1px solid #e5e7eb',
                borderRadius: 2,
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #e5e7eb'
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f8fafc', // slate-50
                  borderBottom: '1px solid #e2e8f0'
                },
                '& .MuiDataGrid-toolbarContainer': {
                  flexDirection: 'row-reverse',
                  padding: '15px'
                },
                '& .MuiDataGrid-columnHeaderRow': {
                  backgroundColor: '#f6f7fb'
                }
              }}
            />
          </div>
        </div>
      </div>

      <ConfirmDialog isOpen={isDelete} handleClose={toggleDelete} onConfirm={handleDelete}>
        {`Bạn có chắc chắn muốn xóa chiến dịch "${selectedPromotion?.title}"? Hành động này không thể hoàn tác.`}
      </ConfirmDialog>

      <AddPromotionModal
        isOpen={isAddModalOpen}
        toggleOpen={() => {
          toggleAddModal();
          setEditPromotionData(null);
        }}
        products={products}
        categories={categories}
        editData={editPromotionData}
      />
    </div>
  );
};

export default ManagePromotionsClient;
