'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDate } from '@/app/(home)/account/orders/OrdersClient';
import { formatPrice } from '../../../../utils/formatPrice';
import { 
  MdLocalShipping, 
  MdCheckCircle, 
  MdRadioButtonUnchecked, 
  MdRefresh,
  MdLocationOn,
  MdPhone,
  MdEmail
} from 'react-icons/md';

interface TrackingData {
  orderCode: string;
  status: string;
  statusText: string;
  systemStatus: string;
  createdDate: string;
  updatedDate: string;
  timeline: Array<{
    status: string;
    description: string;
    updatedDate: string;
  }>;
  order: {
    id: string;
    paymentIntentId: string;
    amount: number;
    createDate: string;
    customerName: string;
    customerPhone: string;
    address: any;
  };
}

interface ShippingTrackerProps {
  orderCode: string;
  orderId?: string;
  showOrderInfo?: boolean;
}

const ShippingTracker: React.FC<ShippingTrackerProps> = ({
  orderCode,
  orderId,
  showOrderInfo = true,
}) => {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const statusIcons = {
    'ready_to_pick': { icon: MdRadioButtonUnchecked, color: 'text-gray-400' },
    'picking': { icon: MdRadioButtonUnchecked, color: 'text-yellow-500' },
    'picked': { icon: MdLocalShipping, color: 'text-blue-500' },
    'storing': { icon: MdLocalShipping, color: 'text-blue-500' },
    'transporting': { icon: MdLocalShipping, color: 'text-blue-500' },
    'sorting': { icon: MdLocalShipping, color: 'text-blue-500' },
    'delivering': { icon: MdLocalShipping, color: 'text-orange-500' },
    'delivered': { icon: MdCheckCircle, color: 'text-green-500' },
    'delivery_fail': { icon: MdRadioButtonUnchecked, color: 'text-red-500' },
    'waiting_to_return': { icon: MdRadioButtonUnchecked, color: 'text-yellow-500' },
    'return': { icon: MdRadioButtonUnchecked, color: 'text-orange-500' },
    'returned': { icon: MdCheckCircle, color: 'text-red-500' },
    'exception': { icon: MdRadioButtonUnchecked, color: 'text-red-500' },
    'damage': { icon: MdRadioButtonUnchecked, color: 'text-red-500' },
    'lost': { icon: MdRadioButtonUnchecked, color: 'text-red-500' },
  };

  const systemStatusLabels = {
    'not_shipped': { text: 'Chưa giao', color: 'bg-gray-100 text-gray-800' },
    'in_transit': { text: 'Đang vận chuyển', color: 'bg-blue-100 text-blue-800' },
    'delivered': { text: 'Đã giao', color: 'bg-green-100 text-green-800' },
    'returning': { text: 'Đang trả về', color: 'bg-orange-100 text-orange-800' },
    'returned': { text: 'Đã trả về', color: 'bg-red-100 text-red-800' },
  };

  const fetchTrackingData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      else setRefreshing(true);

      const response = await axios.get(`/api/shipping/tracking/${orderCode}`);
      
      if (response.data.success) {
        setTrackingData(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching tracking data:', error);
      toast.error('Lỗi khi tải thông tin vận chuyển');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (orderCode) {
      fetchTrackingData();
    }
  }, [orderCode]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          Không tìm thấy thông tin vận chuyển
        </div>
      </div>
    );
  }

  const currentStatusIcon = statusIcons[trackingData.status as keyof typeof statusIcons] || statusIcons['ready_to_pick'];
  const systemStatusLabel = systemStatusLabels[trackingData.systemStatus as keyof typeof systemStatusLabels] || systemStatusLabels['not_shipped'];

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full bg-gray-100 ${currentStatusIcon.color}`}>
            <currentStatusIcon.icon size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Theo dõi vận chuyển
            </h2>
            <p className="text-sm text-gray-600">Mã vận đơn: {trackingData.orderCode}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${systemStatusLabel.color}`}>
            {systemStatusLabel.text}
          </span>
          <button
            onClick={() => fetchTrackingData(false)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <MdRefresh className={refreshing ? 'animate-spin' : ''} size={16} />
            Làm mới
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Current Status */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-full bg-white ${currentStatusIcon.color}`}>
              <currentStatusIcon.icon size={20} />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">{trackingData.statusText}</h3>
              <p className="text-sm text-gray-600">
                Cập nhật lúc: {formatDate(trackingData.updatedDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Order Info */}
        {showOrderInfo && trackingData.order && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Thông tin đơn hàng</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-medium">#{trackingData.order.paymentIntentId.slice(-6).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Giá trị:</span>
                  <span className="font-medium">{formatPrice(trackingData.order.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày đặt:</span>
                  <span>{formatDate(trackingData.order.createDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày tạo vận đơn:</span>
                  <span>{formatDate(trackingData.createdDate)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-800 mb-3">Thông tin giao hàng</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <MdLocationOn className="text-gray-400 mt-0.5" size={16} />
                  <div>
                    <div className="font-medium">{trackingData.order.customerName}</div>
                    {trackingData.order.address && (
                      <div className="text-gray-600">
                        {trackingData.order.address.line1}
                        {trackingData.order.address.line2 && `, ${trackingData.order.address.line2}`}
                        <br />
                        {trackingData.order.address.city}, {trackingData.order.address.postal_code}
                      </div>
                    )}
                  </div>
                </div>
                {trackingData.order.customerPhone && (
                  <div className="flex items-center gap-2">
                    <MdPhone className="text-gray-400" size={16} />
                    <span>{trackingData.order.customerPhone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div>
          <h3 className="font-medium text-gray-800 mb-4">Lịch sử vận chuyển</h3>
          <div className="space-y-4">
            {trackingData.timeline.map((event, index) => {
              const eventIcon = statusIcons[event.status as keyof typeof statusIcons] || statusIcons['ready_to_pick'];
              const isLatest = index === 0;
              
              return (
                <div key={index} className="flex items-start gap-4">
                  <div className={`flex-shrink-0 p-2 rounded-full ${isLatest ? 'bg-blue-100' : 'bg-gray-100'} ${eventIcon.color}`}>
                    <eventIcon.icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm ${isLatest ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                        {event.description}
                      </p>
                      <span className="text-xs text-gray-500 ml-2">
                        {formatDate(event.updatedDate)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Help Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Cần hỗ trợ?</h4>
          <p className="text-sm text-gray-600 mb-2">
            Nếu bạn có thắc mắc về đơn hàng hoặc vận chuyển, vui lòng liên hệ:
          </p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <MdPhone className="text-gray-400" size={16} />
              <span>1900-xxxx</span>
            </div>
            <div className="flex items-center gap-1">
              <MdEmail className="text-gray-400" size={16} />
              <span>support@thanhhuystore.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingTracker;
