'use client';

import { formatPrice } from '../../../../../utils/formatPrice';
import { MdInfo, MdWarning, MdCheckCircle, MdLocalShipping } from 'react-icons/md';

interface ReturnShippingDisplayProps {
  shippingBreakdown: {
    returnShippingFee: number;
    customerShippingFee: number;
    shopShippingFee: number;
    processingFee: number;
    customerPaysShipping: boolean;
    requiresApproval: boolean;
  } | null;
  refundAmount: number;
  reason: string;
}

const ReturnShippingDisplay: React.FC<ReturnShippingDisplayProps> = ({
  shippingBreakdown,
  refundAmount,
  reason
}) => {
  if (!shippingBreakdown) {
    return (
      <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
        <div className='flex items-center gap-2'>
          <MdInfo className='text-gray-500' size={20} />
          <p className='text-gray-600 text-sm'>Không có thông tin phí vận chuyển</p>
        </div>
      </div>
    );
  }

  const getReasonText = (reason: string): string => {
    const reasonTexts: Record<string, string> = {
      'DEFECTIVE': 'Hàng lỗi/hư hỏng',
      'WRONG_ITEM': 'Giao sai hàng',
      'DAMAGED_SHIPPING': 'Hư hỏng trong vận chuyển',
      'CHANGE_MIND': 'Đổi ý không muốn mua',
      'WRONG_SIZE': 'Sai kích thước',
      'NOT_AS_DESCRIBED': 'Không đúng mô tả'
    };
    return reasonTexts[reason] || reason;
  };

  const getShippingIcon = () => {
    if (shippingBreakdown.customerPaysShipping) {
      return <MdWarning className='text-orange-600' size={20} />;
    } else {
      return <MdCheckCircle className='text-green-600' size={20} />;
    }
  };

  const getShippingColor = () => {
    if (shippingBreakdown.customerPaysShipping) {
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800',
        badge: 'bg-orange-100 text-orange-800'
      };
    } else {
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        badge: 'bg-green-100 text-green-800'
      };
    }
  };

  const colors = getShippingColor();

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center gap-2'>
        <MdLocalShipping className='text-blue-600' size={24} />
        <h3 className='text-lg font-semibold text-gray-800'>Chi tiết phí vận chuyển trả hàng</h3>
      </div>

      {/* Main Info */}
      <div className={`${colors.bg} ${colors.border} border rounded-lg p-4 space-y-3`}>
        {/* Reason */}
        <div className='flex justify-between items-center'>
          <span className='text-sm font-medium text-gray-600'>Lý do trả hàng:</span>
          <span className='text-sm font-semibold'>{getReasonText(reason)}</span>
        </div>

        {/* Shipping Responsibility */}
        <div className='flex justify-between items-center'>
          <span className='text-sm font-medium text-gray-600'>Trách nhiệm vận chuyển:</span>
          <div className='flex items-center gap-2'>
            {getShippingIcon()}
            <span className={`text-sm font-semibold ${colors.text}`}>
              {shippingBreakdown.customerPaysShipping ? 'Khách hàng' : 'Cửa hàng'}
            </span>
          </div>
        </div>

        {/* Shipping Fee Breakdown */}
        <div className='border-t pt-3 space-y-2'>
          <h4 className='text-sm font-medium text-gray-700'>Chi tiết phí:</h4>
          
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div className='space-y-1'>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Phí vận chuyển:</span>
                <span className='font-medium'>{formatPrice(shippingBreakdown.returnShippingFee)}</span>
              </div>
              
              {shippingBreakdown.processingFee > 0 && (
                <div className='flex justify-between'>
                  <span className='text-gray-500'>Phí xử lý:</span>
                  <span className='font-medium text-red-600'>
                    -{formatPrice(shippingBreakdown.processingFee)}
                  </span>
                </div>
              )}
            </div>

            <div className='space-y-1'>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Khách hàng trả:</span>
                <span className='font-medium text-red-600'>
                  {shippingBreakdown.customerShippingFee > 0 
                    ? `-${formatPrice(shippingBreakdown.customerShippingFee)}`
                    : formatPrice(0)
                  }
                </span>
              </div>
              
              <div className='flex justify-between'>
                <span className='text-gray-500'>Cửa hàng trả:</span>
                <span className='font-medium text-blue-600'>
                  -{formatPrice(shippingBreakdown.shopShippingFee)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Refund */}
        <div className='border-t pt-3'>
          <div className='flex justify-between items-center'>
            <span className='text-base font-semibold text-gray-800'>Tổng hoàn lại:</span>
            <span className='text-lg font-bold text-green-600'>
              {formatPrice(refundAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Approval Notice */}
      {shippingBreakdown.requiresApproval && (
        <div className='flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
          <MdInfo className='text-yellow-600 mt-0.5' size={20} />
          <div>
            <p className='text-yellow-800 text-sm font-medium'>Yêu cầu phê duyệt</p>
            <p className='text-yellow-700 text-xs mt-1'>
              Yêu cầu trả hàng này cần được admin phê duyệt trước khi xử lý do lý do trả hàng.
            </p>
          </div>
        </div>
      )}

      {/* Policy Info */}
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
        <div className='flex items-start gap-2'>
          <MdInfo className='text-blue-600 mt-0.5' size={16} />
          <div className='text-xs text-blue-800'>
            <p className='font-medium mb-1'>Chính sách vận chuyển trả hàng:</p>
            <ul className='space-y-1 text-blue-700'>
              <li>• Hàng lỗi/giao sai: Cửa hàng chịu toàn bộ phí vận chuyển</li>
              <li>• Đổi ý: Khách hàng chịu phí vận chuyển + phí xử lý 5%</li>
              <li>• Phí vận chuyển được tính theo khoảng cách thực tế</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnShippingDisplay;
