import { formatPrice } from '../../../../../utils/formatPrice';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface KanbanCardProps {
  order: any;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ order }) => {
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'N/A';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'N/A';
      return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  return (
    <div className='bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer'>
      {/* Order ID */}
      <div className='flex items-center justify-between mb-2'>
        <span className='text-blue-600 font-medium text-sm'>#{order.id.slice(-8)}</span>
        <span className='text-xs text-gray-500'>{formatDate(order.createdAt)}</span>
      </div>

      {/* Customer Info */}
      <div className='mb-2'>
        <p className='text-sm font-medium text-gray-900'>{order.user.name}</p>
        <p className='text-xs text-gray-500'>{order.user.email}</p>
      </div>

      {/* Products */}
      <div className='mb-2'>
        <p className='text-xs text-gray-900 mb-1'>Sản phẩm:</p>
        <div className='space-y-1'>
          {order.products.slice(0, 2).map((product: any, index: number) => (
            <div key={index} className='text-xs text-gray-700'>
              • {product.name} x{product.quantity}
            </div>
          ))}
          {order.products.length > 2 && (
            <div className='text-xs text-gray-900'>+{order.products.length - 2} sản phẩm khác</div>
          )}
        </div>
      </div>

      {/* Address */}
      {order.address && (
        <div className='mb-2'>
          <p className='text-xs text-gray-600'>Địa chỉ:</p>
          <p className='text-xs text-gray-700'>
            {order.address.line1 || order.address.street || ''}, {order.address.city}
          </p>
        </div>
      )}

      {/* Phone */}
      {order.phoneNumber && (
        <div className='mb-2'>
          <p className='text-xs text-gray-600'>SĐT: {order.phoneNumber}</p>
        </div>
      )}

      {/* Payment Method */}
      <div className='mb-2'>
        <p className='text-xs text-gray-600'>Thanh toán: {order.paymentMethod || 'COD'}</p>
      </div>

      {/* Sales Staff */}
      <div className='mb-2'>
        <p className='text-xs text-gray-600'>NV bán hàng: {(order as any).salesStaff || 'KH tự đặt'}</p>
      </div>

      {/* Shipping Fee */}
      <div className='mb-2'>
        <p className='text-xs text-gray-900'>
          Phí ship: {order.shippingFee ? formatPrice(order.shippingFee) : 'Chưa tính'}
        </p>
      </div>

      {/* Amount */}
      <div className='flex items-center justify-between pt-2 border-t border-gray-100'>
        <span className='text-xs text-gray-600'>Tổng tiền:</span>
        <span className='text-sm font-semibold text-red-600'>{formatPrice(order.amount)}</span>
      </div>

      {/* Voucher info if exists */}
      {order.voucherCode && (
        <div className='mt-1 text-xs text-green-600'>
          Voucher: {order.voucherCode} (-{formatPrice(order.discountAmount || 0)})
        </div>
      )}

      {/* Cancel reason if exists */}
      {order.status === 'canceled' && order.cancelReason && (
        <div className='mt-2 p-2 bg-red-50 border border-red-200 rounded'>
          <p className='text-xs text-red-600 font-medium'>Lý do hủy:</p>
          <p className='text-xs text-red-700'>{order.cancelReason}</p>
          {order.cancelDate && <p className='text-xs text-red-500 mt-1'>{formatDate(order.cancelDate)}</p>}
        </div>
      )}

      {/* Order note if exists */}
      {order.note && (
        <div className='mt-2 p-2 bg-green-50 border border-green-200 rounded'>
          <p className='text-xs text-green-600 font-medium'>Ghi chú:</p>
          <p className='text-xs text-green-700'>{order.note}</p>
        </div>
      )}
    </div>
  );
};

export default KanbanCard;
