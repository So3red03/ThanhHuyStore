'use client';

import { useState, useEffect } from 'react';
import { SafeUser } from '../../../../../types';
import { formatPrice } from '../../../../../utils/formatPrice';
import { formatDate } from '../../../(home)/account/orders/OrdersClient';
import { DataGrid, GridColDef, GridRenderCellParams, GridToolbar } from '@mui/x-data-grid';
import { MdVisibility, MdCheck, MdClose, MdRefresh, MdUndo, MdAssignment } from 'react-icons/md';
import { Button } from '@mui/material';
import AdminModal from '../../../components/admin/AdminModal';
import ActionBtn from '../../../components/ActionBtn';
import toast from 'react-hot-toast';
import axios from 'axios';
import ReturnRequestProductItem from '../../../components/returns/ReturnRequestProductItem';
import ReturnShippingDisplay from '../../../components/admin/returns/ReturnShippingDisplay';

interface ReturnRequest {
  id: string;
  type: 'RETURN' | 'EXCHANGE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  reason: string;
  description?: string;
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
  const [stats, setStats] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchReturnRequests = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);

      const response = await axios.get(`/api/orders/return-request/admin?${params.toString()}`);
      setReturnRequests(response.data.returnRequests || []);
    } catch (error) {
      console.error('Error fetching return requests:', error);
      toast.error('Không thể tải danh sách yêu cầu đổi/trả');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.post('/api/orders/return-request/admin', {
        action: 'stats'
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchReturnRequests();
    fetchStats();
  }, [statusFilter, typeFilter]);

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
      await Promise.all([fetchReturnRequests(), fetchStats()]);
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
      width: 200,
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
      width: 150,
      renderCell: (params: GridRenderCellParams) => <span className='text-sm'>{getReasonText(params.value)}</span>
    },
    {
      field: 'refundAmount',
      headerName: 'Số tiền',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <span className='font-medium text-green-600'>{params.value ? formatPrice(params.value) : '-'}</span>
      )
    },
    {
      field: 'createdAt',
      headerName: 'Ngày tạo',
      width: 120,
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
        {/* Stats Cards */}
        {stats && (
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
            <div className='bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg'>
              <div className='flex items-center justify-between'>
                <div>
                  <div className='text-3xl font-bold'>{stats.total}</div>
                  <div className='text-blue-100 text-sm'>Tổng yêu cầu</div>
                </div>
                <MdAssignment size={32} className='text-blue-200' />
              </div>
            </div>
            <div className='bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-xl text-white shadow-lg'>
              <div className='flex items-center justify-between'>
                <div>
                  <div className='text-3xl font-bold'>{stats.pending}</div>
                  <div className='text-yellow-100 text-sm'>Chờ duyệt</div>
                </div>
                <MdRefresh size={32} className='text-yellow-200' />
              </div>
            </div>
            <div className='bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg'>
              <div className='flex items-center justify-between'>
                <div>
                  <div className='text-3xl font-bold'>{stats.completed}</div>
                  <div className='text-green-100 text-sm'>Hoàn tất</div>
                </div>
                <MdCheck size={32} className='text-green-200' />
              </div>
            </div>
            <div className='bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg'>
              <div className='flex items-center justify-between'>
                <div>
                  <div className='text-2xl font-bold'>{formatPrice(stats.totalRefundAmount)}</div>
                  <div className='text-purple-100 text-sm'>Tổng hoàn tiền</div>
                </div>
                <MdUndo size={32} className='text-purple-200' />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className='flex justify-end items-center'>
          <div></div>
          <div className='bg-white rounded-lg border p-4 mb-6 shadow-sm w-[65%]'>
            <div className='flex flex-wrap items-end gap-4'>
              <div className='flex-1 min-w-[180px]'>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Trạng thái</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
                >
                  <option value=''>Tất cả trạng thái</option>
                  <option value='PENDING'>Chờ duyệt</option>
                  <option value='APPROVED'>Đã duyệt</option>
                  <option value='REJECTED'>Từ chối</option>
                  <option value='COMPLETED'>Hoàn tất</option>
                </select>
              </div>

              <div className='flex-1 min-w-[180px]'>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Loại yêu cầu</label>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
                >
                  <option value=''>Tất cả loại</option>
                  <option value='RETURN'>Trả hàng</option>
                  <option value='EXCHANGE'>Đổi hàng</option>
                </select>
              </div>

              <div className='flex gap-2'>
                <Button
                  onClick={() => {
                    fetchReturnRequests();
                    fetchStats();
                  }}
                  disabled={isLoading}
                  variant='contained'
                  size='small'
                  startIcon={<MdRefresh className={isLoading ? 'animate-spin' : ''} />}
                  sx={{
                    backgroundColor: '#2563eb',
                    '&:hover': { backgroundColor: '#1d4ed8' },
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    padding: '6px 16px'
                  }}
                >
                  {isLoading ? 'Đang tải...' : 'Làm mới'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className='h-[600px] w-full'>
          <DataGrid
            rows={returnRequests}
            columns={columns}
            className='py-5'
            loading={isLoading}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 }
              }
            }}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 }
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
        {isDetailModalOpen && selectedRequest && (
          <AdminModal isOpen={isDetailModalOpen} handleClose={() => setIsDetailModalOpen(false)}>
            <div className='max-w-2xl mx-auto p-6'>
              <h2 className='text-xl font-bold mb-4'>Chi tiết yêu cầu #{selectedRequest.id.substring(0, 8)}</h2>

              <div className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <strong>Loại:</strong> {getTypeText(selectedRequest.type)}
                  </div>
                  <div>
                    <strong>Trạng thái:</strong> {getStatusText(selectedRequest.status)}
                  </div>
                  <div>
                    <strong>Khách hàng:</strong> {selectedRequest.user.name}
                  </div>
                  <div>
                    <strong>Email:</strong> {selectedRequest.user.email}
                  </div>
                  <div>
                    <strong>Lý do:</strong> {getReasonText(selectedRequest.reason)}
                  </div>
                  <div>
                    <strong>Ngày tạo:</strong> {formatDate(selectedRequest.createdAt)}
                  </div>
                </div>

                {selectedRequest.description && (
                  <div>
                    <strong>Mô tả:</strong>
                    <p className='mt-1 text-gray-600'>{selectedRequest.description}</p>
                  </div>
                )}

                <div>
                  <strong>Sản phẩm ({selectedRequest.items.length}):</strong>
                  <div className='mt-3 space-y-3'>
                    {selectedRequest.items.map((item: any, index: number) => (
                      <ReturnRequestProductItem key={index} item={item} showReason={true} />
                    ))}
                  </div>
                </div>

                {/* Return Shipping Display */}
                {selectedRequest.type === 'RETURN' && selectedRequest.shippingBreakdown && (
                  <ReturnShippingDisplay
                    shippingBreakdown={selectedRequest.shippingBreakdown}
                    refundAmount={selectedRequest.refundAmount || 0}
                    reason={selectedRequest.reason}
                  />
                )}

                {/* Simple refund display for cases without shipping breakdown */}
                {selectedRequest.refundAmount && !selectedRequest.shippingBreakdown && (
                  <div className='p-3 bg-green-50 border border-green-200 rounded'>
                    <strong>Số tiền hoàn:</strong> {formatPrice(selectedRequest.refundAmount)}
                  </div>
                )}

                {selectedRequest.adminNotes && (
                  <div className='p-3 bg-blue-50 border border-blue-200 rounded'>
                    <strong>Ghi chú admin:</strong>
                    <p className='mt-1'>{selectedRequest.adminNotes}</p>
                  </div>
                )}
              </div>
            </div>
          </AdminModal>
        )}

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
