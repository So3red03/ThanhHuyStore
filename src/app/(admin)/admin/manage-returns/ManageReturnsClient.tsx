'use client';

import { useState, useEffect } from 'react';
import { SafeUser } from '../../../../../types';
import { formatPrice } from '../../../../../utils/formatPrice';
import { formatDate } from '../../../(home)/account/orders/OrdersClient';
import { DataGrid, GridColDef, GridRenderCellParams, GridToolbar } from '@mui/x-data-grid';
import { MdVisibility, MdCheck, MdClose, MdRefresh, MdSearch, MdClear } from 'react-icons/md';
import { Button, TextField, FormControl, Select, MenuItem, InputAdornment, Button as MuiButton } from '@mui/material';
import AdminModal from '../../../components/admin/AdminModal';
import ActionBtn from '../../../components/ActionBtn';
import toast from 'react-hot-toast';
import axios from 'axios';
import ReturnsDetailsAdminModal from '@/app/components/admin/returns/ReturnsDetailsAdminModal';

interface ReturnRequest {
  id: string;
  type: 'RETURN' | 'EXCHANGE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  reason: string;
  description?: string;
  images?: string[]; // Base64 images array
  refundAmount?: number;
  additionalCost?: number;
  adminNotes?: string;
  shippingBreakdown?: {
    returnShippingFee: number;
    customerShippingFee: number;
    shopShippingFee: number;
    processingFee: number;
    customerPaysShipping: boolean;
    requiresApproval: boolean;
  };
  // Exchange specific fields
  exchangeToProductId?: string;
  exchangeToVariantId?: string;
  exchangeOrderId?: string;
  createdAt: string;
  items: any[];
  order: {
    id: string;
    amount: number;
    createdAt: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  approver?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ManageReturnsClientProps {
  currentUser: SafeUser;
}

const ManageReturnsClient: React.FC<ManageReturnsClientProps> = ({ currentUser }) => {
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'complete'>('approve');
  const [adminNotes, setAdminNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enhanced Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');

  const [filteredRequests, setFilteredRequests] = useState<ReturnRequest[]>([]);

  // Exchange orders data
  const [exchangeOrders, setExchangeOrders] = useState<{ [key: string]: any }>({});

  const fetchReturnRequests = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);

      const response = await axios.get(`/api/orders/return-request/admin?${params.toString()}`);
      const requests = response.data.returnRequests || [];
      setReturnRequests(requests);

      // Fetch exchange orders for exchange requests
      const exchangeRequestIds = requests
        .filter((req: ReturnRequest) => req.type === 'EXCHANGE' && req.exchangeOrderId)
        .map((req: ReturnRequest) => req.exchangeOrderId);

      if (exchangeRequestIds.length > 0) {
        try {
          const exchangeOrdersResponse = await axios.post('/api/orders/return-request/batch-get-orders', {
            orderIds: exchangeRequestIds
          });

          const exchangeOrdersMap: { [key: string]: any } = {};
          exchangeOrdersResponse.data.orders?.forEach((order: any) => {
            exchangeOrdersMap[order.id] = order;
          });

          setExchangeOrders(exchangeOrdersMap);
        } catch (exchangeError) {
          console.error('Error fetching exchange orders:', exchangeError);
        }
      }
    } catch (error) {
      console.error('Error fetching return requests:', error);
      toast.error('Không thể tải danh sách yêu cầu đổi/trả');
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced search and filter logic
  const handleSearch = () => {
    let filtered = returnRequests;

    // Search by order ID, customer email, or product name
    if (searchTerm) {
      filtered = filtered.filter(
        request =>
          request.order?.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    // Filter by type
    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter(request => request.type === typeFilter);
    }

    // Filter by reason
    if (reasonFilter && reasonFilter !== 'all') {
      filtered = filtered.filter(request => request.reason === reasonFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
    setReasonFilter('');
    setFilteredRequests(returnRequests);
  };

  useEffect(() => {
    fetchReturnRequests();
  }, [statusFilter, typeFilter]);

  // Auto-trigger search when filters change
  useEffect(() => {
    handleSearch();
  }, [searchTerm, statusFilter, typeFilter, reasonFilter, returnRequests]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Chờ duyệt';
      case 'APPROVED':
        return 'Đã duyệt';
      case 'REJECTED':
        return 'Từ chối';
      case 'COMPLETED':
        return 'Hoàn tất';
      default:
        return status;
    }
  };

  const getTypeText = (type: string) => {
    return type === 'RETURN' ? 'Trả hàng' : 'Đổi hàng';
  };

  const getReasonText = (reason: string) => {
    switch (reason) {
      case 'DEFECTIVE':
        return 'Sản phẩm bị lỗi';
      case 'WRONG_ITEM':
        return 'Giao sai sản phẩm';
      case 'CHANGE_MIND':
        return 'Đổi ý không muốn mua';
      case 'SIZE_COLOR':
        return 'Muốn đổi size/màu khác';
      case 'DIFFERENT_MODEL':
        return 'Muốn model/sản phẩm khác';
      default:
        return reason;
    }
  };

  const handleViewDetails = (request: ReturnRequest) => {
    setSelectedRequest(request);
    setIsDetailModalOpen(true);
  };

  const handleAction = (request: ReturnRequest, action: 'approve' | 'reject' | 'complete') => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminNotes('');
    setIsActionModalOpen(true);
  };

  const handleSubmitAction = async () => {
    if (!selectedRequest || isSubmitting) return;

    console.log(`🔄 [MANAGE-RETURNS] Starting ${actionType} action for request:`, selectedRequest.id);
    setIsSubmitting(true);

    try {
      const response = await axios.put(`/api/orders/return-request/${selectedRequest.id}`, {
        action: actionType,
        adminNotes
      });

      console.log(`✅ [MANAGE-RETURNS] ${actionType} action successful:`, response.data);

      toast.success(
        `Đã ${actionType === 'approve' ? 'duyệt' : actionType === 'reject' ? 'từ chối' : 'hoàn tất'} yêu cầu thành công`
      );

      setIsActionModalOpen(false);

      // Refresh data
      console.log(`🔄 [MANAGE-RETURNS] Refreshing data after ${actionType} action`);
      await fetchReturnRequests();
    } catch (error: any) {
      console.error(`❌ [MANAGE-RETURNS] Error processing ${actionType} action:`, error);
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <span className='font-mono text-sm'>#{params.value.substring(0, 8)}</span>
      )
    },
    {
      field: 'type',
      headerName: 'Loại',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            params.value === 'RETURN' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
          }`}
        >
          {getTypeText(params.value)}
        </span>
      )
    },

    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(params.value)}`}>
          {getStatusText(params.value)}
        </span>
      )
    },
    {
      field: 'user',
      headerName: 'Khách hàng',
      width: 160,
      renderCell: (params: GridRenderCellParams) => (
        <div>
          <div className='font-medium'>{params.value.name}</div>
          <div className='text-sm text-gray-500'>{params.value.email}</div>
        </div>
      )
    },
    {
      field: 'reason',
      headerName: 'Lý do',
      width: 180,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const reason = params.value;
        const getReasonColor = (reason: string) => {
          switch (reason) {
            case 'DEFECTIVE':
              return 'bg-red-100 text-red-800 border-red-200';
            case 'WRONG_ITEM':
              return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'CHANGE_MIND':
              return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
              return 'bg-gray-100 text-gray-800 border-gray-200';
          }
        };

        return (
          <div className='h-full flex justify-center items-center'>
            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getReasonColor(reason)} mx-auto`}>
              {getReasonText(reason)}
            </div>
          </div>
        );
      }
    },
    {
      field: 'financialImpact',
      headerName: 'Tác động tài chính',
      width: 160,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const row = params.row;
        const reason = row.reason;
        const type = row.type;

        // Calculate who pays what based on reason
        const getFinancialImpact = () => {
          if (type === 'RETURN') {
            switch (reason) {
              case 'DEFECTIVE':
                return { text: 'Shop chịu 100%', color: 'text-red-600', bg: 'bg-red-50' };
              case 'WRONG_ITEM':
                return { text: 'Shop chịu 100%', color: 'text-red-600', bg: 'bg-red-50' };
              case 'CHANGE_MIND':
                return { text: 'Khách chịu phí ship', color: 'text-orange-600', bg: 'bg-orange-50' };
              default:
                return { text: 'Chưa xác định', color: 'text-gray-600', bg: 'bg-gray-50' };
            }
          } else {
            switch (reason) {
              case 'DEFECTIVE':
              case 'WRONG_ITEM':
                return { text: 'Shop chịu ship', color: 'text-red-600', bg: 'bg-red-50' };
              case 'CHANGE_MIND':
                return { text: 'Khách chịu ship', color: 'text-orange-600', bg: 'bg-orange-50' };
              default:
                return { text: 'Chưa xác định', color: 'text-gray-600', bg: 'bg-gray-50' };
            }
          }
        };

        const impact = getFinancialImpact();
        return (
          <div className='h-full flex justify-center items-center'>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${impact.color} ${impact.bg}`}>
              {impact.text}
            </div>
          </div>
        );
      }
    },

    {
      field: 'refundAmount',
      headerName: 'Chi tiết tài chính',
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        const row = params.row;
        const type = row.type;
        const refundAmount = params.value;
        const additionalCost = row.additionalCost;

        if (type === 'RETURN') {
          return (
            <div className='space-y-1'>
              <div className='text-sm font-medium text-green-600'>{refundAmount ? formatPrice(refundAmount) : '-'}</div>
              {row.shippingBreakdown && (
                <div className='text-xs text-gray-500'>
                  Ship: {formatPrice(row.shippingBreakdown.returnShippingFee || 0)}
                </div>
              )}
            </div>
          );
        } else {
          // Exchange
          return (
            <div className='space-y-1'>
              {additionalCost !== undefined && additionalCost !== 0 ? (
                <div className={`text-sm font-medium ${additionalCost > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {additionalCost > 0 ? '+' : ''}
                  {formatPrice(additionalCost)}
                </div>
              ) : (
                <div className='text-sm text-gray-500'>Không chênh lệch</div>
              )}
              <div className='text-xs text-gray-500'>
                {row.reason === 'CHANGE_MIND' ? 'Khách trả ship' : 'Shop trả ship'}
              </div>
            </div>
          );
        }
      }
    },
    {
      field: 'createdAt',
      headerName: 'Ngày tạo',
      width: 190,
      renderCell: (params: GridRenderCellParams) => <span className='text-sm'>{formatDate(params.value)}</span>
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      width: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const request = params.row as ReturnRequest;
        return (
          <div className='flex items-center justify-center gap-2 h-full'>
            <ActionBtn icon={MdVisibility} onClick={() => handleViewDetails(request)} />

            {request.status === 'PENDING' && (
              <>
                <ActionBtn icon={MdCheck} onClick={() => handleAction(request, 'approve')} />
                <ActionBtn icon={MdClose} onClick={() => handleAction(request, 'reject')} />
              </>
            )}

            {request.status === 'APPROVED' && (
              <ActionBtn icon={MdCheck} onClick={() => handleAction(request, 'complete')} />
            )}
          </div>
        );
      }
    }
  ];

  return (
    <>
      <div className='w-full m-auto text-xl mt-6'>
        {/* Enhanced Search Form */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6'>
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
            {/* Search Input */}
            <div className='lg:col-span-2'>
              <label className='block text-sm font-semibold text-gray-700 mb-3'>Tìm kiếm</label>
              <TextField
                size='medium'
                placeholder='Tìm theo mã đơn, khách hàng, sản phẩm...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                sx={{
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    backgroundColor: '#f9fafb',
                    '&:hover': {
                      backgroundColor: '#f3f4f6'
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3b82f6',
                        borderWidth: '2px'
                      }
                    }
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <MuiButton
                        size='medium'
                        onClick={handleSearch}
                        startIcon={<MdSearch />}
                        variant='contained'
                        sx={{
                          minWidth: 'auto',
                          px: 2,
                          backgroundColor: '#3b82f6',
                          '&:hover': { backgroundColor: '#2563eb' }
                        }}
                      >
                        Tìm
                      </MuiButton>
                    </InputAdornment>
                  )
                }}
              />
            </div>

            {/* Type Filter */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-3'>Loại yêu cầu</label>
              <FormControl fullWidth size='medium'>
                <Select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: '8px',
                    backgroundColor: '#f9fafb',
                    '&:hover': { backgroundColor: '#f3f4f6' },
                    '&.Mui-focused': {
                      backgroundColor: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3b82f6',
                        borderWidth: '2px'
                      }
                    }
                  }}
                >
                  <MenuItem value=''>Tất cả loại</MenuItem>
                  <MenuItem value='RETURN'>Trả hàng</MenuItem>
                  <MenuItem value='EXCHANGE'>Đổi hàng</MenuItem>
                </Select>
              </FormControl>
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
                    '&:hover': { backgroundColor: '#f3f4f6' },
                    '&.Mui-focused': {
                      backgroundColor: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3b82f6',
                        borderWidth: '2px'
                      }
                    }
                  }}
                >
                  <MenuItem value=''>Tất cả trạng thái</MenuItem>
                  <MenuItem value='PENDING'>Chờ duyệt</MenuItem>
                  <MenuItem value='APPROVED'>Đã duyệt</MenuItem>
                  <MenuItem value='REJECTED'>Từ chối</MenuItem>
                  <MenuItem value='COMPLETED'>Hoàn tất</MenuItem>
                </Select>
              </FormControl>
            </div>

            {/* Reason Filter */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-3'>Lý do</label>
              <FormControl fullWidth size='medium'>
                <Select
                  value={reasonFilter}
                  onChange={e => setReasonFilter(e.target.value)}
                  displayEmpty
                  sx={{
                    borderRadius: '8px',
                    backgroundColor: '#f9fafb',
                    '&:hover': { backgroundColor: '#f3f4f6' },
                    '&.Mui-focused': {
                      backgroundColor: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3b82f6',
                        borderWidth: '2px'
                      }
                    }
                  }}
                >
                  <MenuItem value=''>Tất cả lý do</MenuItem>
                  <MenuItem value='DEFECTIVE'>Sản phẩm bị lỗi</MenuItem>
                  <MenuItem value='WRONG_ITEM'>Giao sai sản phẩm</MenuItem>
                  <MenuItem value='CHANGE_MIND'>Đổi ý không muốn mua</MenuItem>
                  <MenuItem value='SIZE_COLOR'>Muốn đổi size/màu khác</MenuItem>
                  <MenuItem value='DIFFERENT_MODEL'>Muốn model/sản phẩm khác</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>

          {/* Filter Actions */}
          <div className='flex justify-between items-center mt-6 pt-4 border-t border-gray-200'>
            <div className='text-sm text-gray-600'>
              {filteredRequests.length > 0 || searchTerm || statusFilter || typeFilter || reasonFilter
                ? `Hiển thị ${filteredRequests.length} / ${returnRequests.length} yêu cầu`
                : `Tổng ${returnRequests.length} yêu cầu`}
            </div>

            <div className='flex gap-3'>
              {(searchTerm || statusFilter || typeFilter || reasonFilter) && (
                <MuiButton
                  onClick={handleClearFilters}
                  startIcon={<MdClear />}
                  variant='outlined'
                  sx={{
                    borderColor: '#d1d5db',
                    color: '#6b7280',
                    '&:hover': {
                      borderColor: '#9ca3af',
                      backgroundColor: '#f9fafb'
                    },
                    textTransform: 'none',
                    fontSize: '0.875rem'
                  }}
                >
                  Xóa bộ lọc
                </MuiButton>
              )}

              <MuiButton
                onClick={() => {
                  fetchReturnRequests();
                }}
                disabled={isLoading}
                startIcon={<MdRefresh className={isLoading ? 'animate-spin' : ''} />}
                variant='contained'
                sx={{
                  backgroundColor: '#3b82f6',
                  '&:hover': { backgroundColor: '#2563eb' },
                  textTransform: 'none',
                  fontSize: '0.875rem'
                }}
              >
                {isLoading ? 'Đang tải...' : 'Làm mới'}
              </MuiButton>
            </div>
          </div>
        </div>

        <div className='h-[600px] w-full'>
          <DataGrid
            rows={
              filteredRequests.length > 0 || searchTerm || statusFilter || typeFilter || reasonFilter
                ? filteredRequests
                : returnRequests
            }
            columns={columns}
            className='py-5'
            loading={isLoading}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 }
              }
            }}
            pageSizeOptions={[10, 20, 30]}
            checkboxSelection
            disableRowSelectionOnClick
            disableColumnFilter
            disableDensitySelector
            disableColumnSelector
            sx={{
              border: '1px solid #e2e8f0',
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

        {/* Detail Modal */}
        <ReturnsDetailsAdminModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          request={selectedRequest}
          exchangeOrders={exchangeOrders}
        />

        {/* Action Modal */}
        {isActionModalOpen && selectedRequest && (
          <AdminModal isOpen={isActionModalOpen} handleClose={() => setIsActionModalOpen(false)}>
            <div className='max-w-md mx-auto p-6'>
              <h2 className='text-xl font-bold mb-4'>
                {actionType === 'approve'
                  ? 'Duyệt yêu cầu'
                  : actionType === 'reject'
                  ? 'Từ chối yêu cầu'
                  : 'Hoàn tất yêu cầu'}
              </h2>

              <div className='mb-4'>
                <p className='text-gray-600'>
                  Yêu cầu #{selectedRequest.id.substring(0, 8)} - {getTypeText(selectedRequest.type)}
                </p>
              </div>

              <div className='mb-4'>
                <label className='block text-sm font-medium mb-2'>Ghi chú (tùy chọn)</label>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder='Thêm ghi chú cho khách hàng...'
                  className='w-full px-3 py-2 border rounded-lg'
                  rows={3}
                />
              </div>

              <div className='flex justify-end gap-3'>
                <Button variant='outlined' onClick={() => setIsActionModalOpen(false)} disabled={isSubmitting}>
                  Hủy
                </Button>
                <Button
                  variant='contained'
                  onClick={handleSubmitAction}
                  color={actionType === 'reject' ? 'error' : 'primary'}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Đang xử lý...'
                    : actionType === 'approve'
                    ? 'Duyệt'
                    : actionType === 'reject'
                    ? 'Từ chối'
                    : 'Hoàn tất'}
                </Button>
              </div>
            </div>
          </AdminModal>
        )}
      </div>
    </>
  );
};

export default ManageReturnsClient;
