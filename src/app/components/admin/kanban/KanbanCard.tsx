import { formatPrice } from '../../../../../utils/formatPrice';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface KanbanCardProps {
  order: any;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ order }) => {
  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: vi });
  };

  return (
    <div className='bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer'>
      {/* Order ID */}
      <div className='flex items-center justify-between mb-2'>
        <span className='text-blue-600 font-medium text-sm'>#{order.id.slice(-8)}</span>
        <span className='text-xs text-gray-500'>{formatDate(order.createDate)}</span>
      </div>

      {/* Customer Info */}
      <div className='mb-2'>
        <p className='text-sm font-medium text-gray-900'>{order.user.name}</p>
        <p className='text-xs text-gray-500'>{order.user.email}</p>
      </div>

      {/* Products */}
      <div className='mb-2'>
        <p className='text-xs text-gray-600 mb-1'>Sản phẩm:</p>
        <div className='space-y-1'>
          {order.products.slice(0, 2).map((product: any, index: number) => (
            <div key={index} className='text-xs text-gray-700'>
              • {product.name} x{product.quantity}
            </div>
          ))}
          {order.products.length > 2 && (
            <div className='text-xs text-gray-500'>+{order.products.length - 2} sản phẩm khác</div>
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
        <p className='text-xs text-gray-600'>Thanh toán: {order.paymentMethod || 'Chưa xác định'}</p>
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
    </div>
  );
};

export default KanbanCard;
