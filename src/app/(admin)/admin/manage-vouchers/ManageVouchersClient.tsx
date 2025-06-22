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
import AddVoucherModal from './AddVoucherModal';
import { SafeUser } from '../../../../../types';
import { Button, TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel, Chip, Box } from '@mui/material';

interface ManageVouchersClientProps {
  vouchers: any[];
  users: any[];
  currentUser: SafeUser | null | undefined;
}

const ManageVouchersClient: React.FC<ManageVouchersClientProps> = ({ vouchers, users, currentUser }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [isDelete, setIsDelete] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Enhanced search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [discountTypeFilter, setDiscountTypeFilter] = useState('all');
  const [filteredVouchers, setFilteredVouchers] = useState(vouchers);

  const toggleDelete = () => {
    setIsDelete(!isDelete);
  };

  const toggleAddModal = () => {
    setIsAddModalOpen(!isAddModalOpen);
  };

  const toggleEditModal = () => {
    setIsEditModalOpen(!isEditModalOpen);
  };

  const handleOpenEditModal = (voucher: any) => {
    setSelectedVoucher(voucher);
    toggleEditModal();
  };

  const handleDelete = async () => {
    if (!selectedVoucher) return;

    setIsLoading(true);
    try {
      await axios.delete(`/api/voucher/${selectedVoucher.id}`);
      toast.success('Xóa voucher thành công');
      router.refresh();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xóa voucher');
    } finally {
      setIsLoading(false);
      toggleDelete();
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setIsLoading(true);
    try {
      await axios.put(`/api/voucher/${id}`, { isActive: !currentStatus });
      toast.success(`${!currentStatus ? 'Kích hoạt' : 'Tạm dừng'} voucher thành công`);
      router.refresh();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái voucher');
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced filter logic
  const handleSearch = () => {
    let filtered = vouchers;

    // Search by code or description
    if (searchTerm) {
      filtered = filtered.filter(
        voucher =>
          voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          voucher.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(voucher => voucher.isActive === isActive);
    }

    // Filter by voucher type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(voucher => voucher.voucherType === typeFilter);
    }

    // Filter by discount type
    if (discountTypeFilter !== 'all') {
      filtered = filtered.filter(voucher => voucher.discountType === discountTypeFilter);
    }

    setFilteredVouchers(filtered);
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
    setDiscountTypeFilter('all');
    setFilteredVouchers(vouchers);
  };

  let rows: any = [];
  if (filteredVouchers) {
    rows = filteredVouchers.map(voucher => {
      const usageCount = voucher.userVouchers?.length || 0;
      const usagePercentage = voucher.quantity > 0 ? (usageCount / voucher.quantity) * 100 : 0;

      return {
        id: voucher.id,
        code: voucher.code,
        description: voucher.description,
        image: voucher.image,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        minOrderValue: voucher.minOrderValue,
        quantity: voucher.quantity,
        usedCount: usageCount,
        usagePercentage: usagePercentage.toFixed(1),
        maxUsagePerUser: voucher.maxUsagePerUser,
        startDate: voucher.startDate,
        endDate: voucher.endDate,
        isActive: voucher.isActive,
        voucherType: voucher.voucherType,
        createdAt: voucher.createdAt
      };
    });
  }

  const columns: GridColDef[] = [
    { field: 'code', headerName: 'Mã Voucher', width: 120 },
    { field: 'description', headerName: 'Mô tả', width: 200 },
    {
      field: 'discountValue',
      headerName: 'Giá trị',
      width: 100,
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
      field: 'minOrderValue',
      headerName: 'Đơn tối thiểu',
      width: 120,
      renderCell: params => {
        return params.row.minOrderValue ? formatPrice(params.row.minOrderValue) : 'Không';
      }
    },
    {
      field: 'usage',
      headerName: 'Sử dụng',
      width: 120,
      renderCell: params => {
        return (
          <div className='text-center'>
            <div className='text-sm font-semibold'>
              {params.row.usedCount}/{params.row.quantity}
            </div>
            <div className='text-xs text-gray-500'>({params.row.usagePercentage}%)</div>
          </div>
        );
      }
    },
    {
      field: 'voucherType',
      headerName: 'Loại',
      width: 100,
      renderCell: params => {
        const typeColors: { [key: string]: { bg: string; color: string } } = {
          NEW_USER: { bg: 'bg-blue-200', color: 'text-blue-700' },
          RETARGETING: { bg: 'bg-purple-200', color: 'text-purple-700' },
          UPSELL: { bg: 'bg-green-200', color: 'text-green-700' },
          LOYALTY: { bg: 'bg-yellow-200', color: 'text-yellow-700' },
          EVENT: { bg: 'bg-red-200', color: 'text-red-700' },
          GENERAL: { bg: 'bg-gray-200', color: 'text-gray-700' }
        };
        const typeColor = typeColors[params.row.voucherType] || typeColors.GENERAL;
        return <Status text={params.row.voucherType} bg={typeColor.bg} color={typeColor.color} />;
      }
    },
    {
      field: 'endDate',
      headerName: 'Hết hạn',
      width: 100,
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
      width: 200,
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
                setSelectedVoucher(params.row);
                toggleDelete();
              }}
            />
          </div>
        );
      }
    }
  ];

  if (!vouchers || vouchers.length === 0) {
    return (
      <div className='w-[78.5vw] m-auto text-xl mt-6'>
        {/* Header */}
        <div className='px-6 py-5'>
          <div className='flex items-center justify-between mb-6'>
            <div className='flex items-center gap-3'>
              <h1 className='text-3xl font-bold text-gray-800'>🎫 Quản lý Voucher</h1>
            </div>
            <div className='flex items-center gap-3'>
              <Button
                variant='contained'
                startIcon={<MdAdd />}
                onClick={toggleAddModal}
                size='medium'
                sx={{
                  backgroundColor: '#8b5cf6',
                  '&:hover': {
                    backgroundColor: '#7c3aed'
                  },
                  boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Thêm Voucher
              </Button>
            </div>
          </div>
        </div>

        <div className='px-6'>
          <NullData title='Chưa có voucher nào được tạo' />
        </div>

        <AddVoucherModal isOpen={isAddModalOpen} toggleOpen={toggleAddModal} users={users} />
      </div>
    );
  }

  return (
    <div className='w-[78.5vw] m-auto text-xl mt-6'>
      {/* Header */}
      <div className='px-6 py-5'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <h1 className='text-3xl font-bold text-gray-800'>🎫 Quản lý Voucher</h1>
            <Chip
              label={`${filteredVouchers.length} voucher`}
              size='medium'
              sx={{
                backgroundColor: '#ede9fe',
                color: '#7c3aed',
                fontWeight: 600
              }}
            />
          </div>
          <div className='flex items-center gap-3'>
            <Button
              variant='outlined'
              startIcon={<MdRefresh />}
              onClick={handleRefresh}
              disabled={isLoading}
              size='medium'
              sx={{
                borderColor: '#e5e7eb',
                color: '#6b7280',
                '&:hover': {
                  borderColor: '#d1d5db',
                  backgroundColor: '#f9fafb'
                }
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
                backgroundColor: '#8b5cf6',
                '&:hover': {
                  backgroundColor: '#7c3aed'
                },
                boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Thêm Voucher
            </Button>
          </div>
        </div>

        {/* Enhanced Search Form */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6'>
          <div className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
            {/* Search Input */}
            <div className='lg:col-span-2'>
              <label className='block text-sm font-semibold text-gray-700 mb-3'>🔍 Tìm kiếm</label>
              <TextField
                size='medium'
                placeholder='Tìm theo mã voucher hoặc mô tả...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                sx={{
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#f9fafb',
                    '& fieldset': {
                      borderColor: '#e5e7eb'
                    },
                    '&:hover fieldset': {
                      borderColor: '#d1d5db'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#8b5cf6',
                      backgroundColor: '#ffffff'
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
                          backgroundColor: '#8b5cf6',
                          '&:hover': {
                            backgroundColor: '#7c3aed'
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
              <label className='block text-sm font-semibold text-gray-700 mb-3'>📊 Trạng thái</label>
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
                        borderColor: '#8b5cf6',
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

            {/* Voucher Type Filter */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-3'>🏷️ Loại voucher</label>
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
                        borderColor: '#8b5cf6',
                        backgroundColor: '#ffffff'
                      }
                    }
                  }}
                >
                  <MenuItem value='all'>Tất cả</MenuItem>
                  <MenuItem value='NEW_USER'>🆕 Người dùng mới</MenuItem>
                  <MenuItem value='RETARGETING'>🎯 Tái tiếp thị</MenuItem>
                  <MenuItem value='UPSELL'>📈 Bán thêm</MenuItem>
                  <MenuItem value='LOYALTY'>💎 Khách hàng thân thiết</MenuItem>
                  <MenuItem value='EVENT'>🎉 Sự kiện</MenuItem>
                  <MenuItem value='GENERAL'>📋 Chung</MenuItem>
                </Select>
              </FormControl>
            </div>

            {/* Discount Type Filter */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-3'>💰 Loại giảm giá</label>
              <FormControl fullWidth size='medium'>
                <Select
                  value={discountTypeFilter}
                  onChange={e => setDiscountTypeFilter(e.target.value)}
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
                        borderColor: '#8b5cf6',
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
            {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || discountTypeFilter !== 'all') && (
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
            {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || discountTypeFilter !== 'all') && (
              <div className='px-4 py-2 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg'>
                <div className='text-sm font-medium text-purple-800'>
                  🎯 <strong>Kết quả:</strong> {filteredVouchers.length} voucher
                  {filteredVouchers.length === 0 && (
                    <span className='text-red-600 ml-2'>- Không tìm thấy voucher nào phù hợp</span>
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
                border: 'none',
                '& .MuiDataGrid-cell': {
                  borderColor: '#f3f4f6'
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f9fafb',
                  borderColor: '#f3f4f6'
                }
              }}
            />
          </div>
        </div>
      </div>

      <ConfirmDialog isOpen={isDelete} handleClose={toggleDelete} onConfirm={handleDelete}>
        {`Bạn có chắc chắn muốn xóa voucher "${selectedVoucher?.code}"? Hành động này không thể hoàn tác.`}
      </ConfirmDialog>

      <AddVoucherModal isOpen={isAddModalOpen} toggleOpen={toggleAddModal} users={users} />

      {selectedVoucher && (
        <AddVoucherModal
          isOpen={isEditModalOpen}
          toggleOpen={toggleEditModal}
          users={users}
          voucher={selectedVoucher}
          isEdit={true}
        />
      )}
    </div>
  );
};

export default ManageVouchersClient;
