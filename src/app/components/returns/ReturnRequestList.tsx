'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatPrice } from '../../../../utils/formatPrice';
import { formatDate } from '@/app/(home)/account/orders/OrdersClient';
import { MdVisibility, MdCheck, MdClose, MdRefresh } from 'react-icons/md';
import Image from 'next/image';

interface ReturnRequest {
  id: string;
  orderId: string;
  orderCode: string;
  type: 'EXCHANGE' | 'RETURN' | 'REFUND';
  reason: string;
  description?: string;
  images: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  adminNote?: string;
  createdAt: string;
  processedAt?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  order: {
    id: string;
    amount: number;
    paymentIntentId: string;
    createDate: string;
    products: any[];
  };
}

interface ReturnRequestListProps {
  isAdmin?: boolean;
}

const ReturnRequestList: React.FC<ReturnRequestListProps> = ({ isAdmin = false }) => {
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'ALL',
    page: 1,
    limit: 10,
  });

  const statusLabels = {
    PENDING: { text: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' },
    APPROVED: { text: 'Đã duyệt', color: 'bg-blue-100 text-blue-800' },
    REJECTED: { text: 'Từ chối', color: 'bg-red-100 text-red-800' },
    COMPLETED: { text: 'Hoàn tất', color: 'bg-green-100 text-green-800' },
  };

  const typeLabels = {
    EXCHANGE: { text: 'Đổi hàng', color: 'bg-purple-100 text-purple-800' },
    RETURN: { text: 'Trả hàng', color: 'bg-orange-100 text-orange-800' },
    REFUND: { text: 'Hoàn tiền', color: 'bg-indigo-100 text-indigo-800' },
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: filters.status,
        page: filters.page.toString(),
        limit: filters.limit.toString(),
      });

      const response = await axios.get(`/api/returns/list?${params}`);
      
      if (response.data.success) {
        setRequests(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching return requests:', error);
      toast.error('Lỗi khi tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRequest = async (requestId: string, action: 'APPROVE' | 'REJECT' | 'COMPLETE', adminNote?: string) => {
    try {
      setProcessingId(requestId);
      
      const response = await axios.post(`/api/returns/${requestId}/process`, {
        action,
        adminNote,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        fetchRequests(); // Refresh list
        setSelectedRequest(null);
      }
    } catch (error: any) {
      console.error('Error processing request:', error);
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          {isAdmin ? 'Quản lý yêu cầu đổi/trả' : 'Yêu cầu đổi/trả của tôi'}
        </h2>
        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">Tất cả</option>
            <option value="PENDING">Chờ xử lý</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Từ chối</option>
            <option value="COMPLETED">Hoàn tất</option>
          </select>
          
          <button
            onClick={fetchRequests}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MdRefresh size={16} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Đơn hàng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Loại
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lý do
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày tạo
              </th>
              {isAdmin && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      #{request.orderCode}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatPrice(request.order.amount)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeLabels[request.type].color}`}>
                    {typeLabels[request.type].text}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {request.reason}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusLabels[request.status].color}`}>
                    {statusLabels[request.status].text}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(request.createdAt)}
                </td>
                {isAdmin && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{request.user.name}</div>
                    <div className="text-sm text-gray-500">{request.user.email}</div>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Xem chi tiết"
                    >
                      <MdVisibility size={18} />
                    </button>
                    
                    {isAdmin && request.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleProcessRequest(request.id, 'APPROVE')}
                          disabled={processingId === request.id}
                          className="text-green-600 hover:text-green-900 transition-colors disabled:opacity-50"
                          title="Duyệt"
                        >
                          <MdCheck size={18} />
                        </button>
                        <button
                          onClick={() => handleProcessRequest(request.id, 'REJECT')}
                          disabled={processingId === request.id}
                          className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50"
                          title="Từ chối"
                        >
                          <MdClose size={18} />
                        </button>
                      </>
                    )}
                    
                    {isAdmin && request.status === 'APPROVED' && (
                      <button
                        onClick={() => handleProcessRequest(request.id, 'COMPLETE')}
                        disabled={processingId === request.id}
                        className="text-blue-600 hover:text-blue-900 transition-colors disabled:opacity-50"
                        title="Hoàn tất"
                      >
                        Hoàn tất
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {requests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Không có yêu cầu đổi/trả nào</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <ReturnRequestDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onProcess={isAdmin ? handleProcessRequest : undefined}
          isProcessing={processingId === selectedRequest.id}
        />
      )}
    </div>
  );
};

// Detail Modal Component
interface ReturnRequestDetailModalProps {
  request: ReturnRequest;
  onClose: () => void;
  onProcess?: (requestId: string, action: 'APPROVE' | 'REJECT' | 'COMPLETE', adminNote?: string) => void;
  isProcessing?: boolean;
}

const ReturnRequestDetailModal: React.FC<ReturnRequestDetailModalProps> = ({
  request,
  onClose,
  onProcess,
  isProcessing,
}) => {
  const [adminNote, setAdminNote] = useState('');

  const statusLabels = {
    PENDING: { text: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' },
    APPROVED: { text: 'Đã duyệt', color: 'bg-blue-100 text-blue-800' },
    REJECTED: { text: 'Từ chối', color: 'bg-red-100 text-red-800' },
    COMPLETED: { text: 'Hoàn tất', color: 'bg-green-100 text-green-800' },
  };

  const typeLabels = {
    EXCHANGE: { text: 'Đổi hàng', color: 'bg-purple-100 text-purple-800' },
    RETURN: { text: 'Trả hàng', color: 'bg-orange-100 text-orange-800' },
    REFUND: { text: 'Hoàn tiền', color: 'bg-indigo-100 text-indigo-800' },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Chi tiết yêu cầu đổi/trả
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Thông tin yêu cầu</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-medium">#{request.orderCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Loại:</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${typeLabels[request.type].color}`}>
                    {typeLabels[request.type].text}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusLabels[request.status].color}`}>
                    {statusLabels[request.status].text}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày tạo:</span>
                  <span>{formatDate(request.createdAt)}</span>
                </div>
                {request.processedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày xử lý:</span>
                    <span>{formatDate(request.processedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-800 mb-3">Thông tin đơn hàng</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Khách hàng:</span>
                  <span className="font-medium">{request.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span>{request.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Giá trị đơn hàng:</span>
                  <span className="font-medium">{formatPrice(request.order.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày đặt:</span>
                  <span>{formatDate(request.order.createDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reason & Description */}
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Lý do và mô tả</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">Lý do:</span>
                <p className="text-gray-800">{request.reason}</p>
              </div>
              {request.description && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Mô tả chi tiết:</span>
                  <p className="text-gray-800">{request.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Images */}
          {request.images.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Hình ảnh bằng chứng</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {request.images.map((image, index) => (
                  <Image
                    key={index}
                    src={image}
                    alt={`Evidence ${index + 1}`}
                    width={200}
                    height={200}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Admin Note */}
          {request.adminNote && (
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Ghi chú của admin</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-800">{request.adminNote}</p>
              </div>
            </div>
          )}

          {/* Admin Actions */}
          {onProcess && request.status === 'PENDING' && (
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Xử lý yêu cầu</h3>
              <div className="space-y-3">
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Ghi chú cho khách hàng (tùy chọn)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => onProcess(request.id, 'APPROVE', adminNote)}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {isProcessing ? 'Đang xử lý...' : 'Duyệt yêu cầu'}
                  </button>
                  <button
                    onClick={() => onProcess(request.id, 'REJECT', adminNote)}
                    disabled={isProcessing}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {isProcessing ? 'Đang xử lý...' : 'Từ chối'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {onProcess && request.status === 'APPROVED' && (
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Hoàn tất xử lý</h3>
              <button
                onClick={() => onProcess(request.id, 'COMPLETE', adminNote)}
                disabled={isProcessing}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? 'Đang xử lý...' : 'Đánh dấu hoàn tất'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReturnRequestList;
