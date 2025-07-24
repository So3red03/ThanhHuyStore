'use client';

import { useState, useEffect } from 'react';
import { formatPrice } from '../../../../utils/formatPrice';
import { MdInfo, MdWarning, MdCheckCircle } from 'react-icons/md';

interface ReturnShippingBreakdownProps {
  orderId: string;
  reason: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  onCalculationComplete?: (breakdown: any) => void;
}

interface ShippingBreakdown {
  reason: string;
  reasonText: string;
  customerPaysShipping: boolean;
  shippingResponsibility: string;
  returnShippingFee: number;
  customerShippingFee: number;
  shopShippingFee: number;
  refundAmount: number;
  processingFee: number;
  totalRefund: number;
  requiresApproval: boolean;
}

const ReturnShippingBreakdown: React.FC<ReturnShippingBreakdownProps> = ({
  orderId,
  reason,
  items,
  onCalculationComplete
}) => {
  const [breakdown, setBreakdown] = useState<ShippingBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId && reason && items.length > 0) {
      calculateReturnShipping();
    }
  }, [orderId, reason, items]);

  const calculateReturnShipping = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/orders/return-shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          reason,
          items
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBreakdown(data.breakdown);
          onCalculationComplete?.(data.breakdown);
        } else {
          setError('Không thể tính phí vận chuyển trả hàng');
        }
      } else {
        setError('Lỗi khi tính phí vận chuyển');
      }
    } catch (error) {
      console.error('Error calculating return shipping:', error);
      setError('Có lỗi xảy ra khi tính phí vận chuyển');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
        <div className='flex items-center gap-2'>
          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
          <p className='text-blue-800 text-sm'>Đang tính phí vận chuyển trả hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
        <div className='flex items-center gap-2'>
          <MdWarning className='text-red-600' size={20} />
          <p className='text-red-800 text-sm'>{error}</p>
        </div>
      </div>
    );
  }

  if (!breakdown) {
    return null;
  }

  const getShippingIcon = () => {
    if (breakdown.customerPaysShipping) {
      return <MdWarning className='text-orange-600' size={20} />;
    } else {
      return <MdCheckCircle className='text-green-600' size={20} />;
    }
  };

  const getShippingColor = () => {
    if (breakdown.customerPaysShipping) {
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800'
      };
    } else {
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800'
      };
    }
  };

  const colors = getShippingColor();

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-lg p-4 space-y-3`}>
      {/* Header */}
      <div className='flex items-center gap-2'>
        {getShippingIcon()}
        <h3 className={`${colors.text} font-medium text-sm`}>Thông tin phí vận chuyển trả hàng</h3>
      </div>

      {/* Reason */}
      <div className='flex justify-between items-center'>
        <span className='text-sm text-gray-600'>Lý do trả hàng:</span>
        <span className='text-sm font-medium'>{breakdown.reasonText}</span>
      </div>

      {/* Shipping Responsibility */}
      <div className='flex justify-between items-center'>
        <span className='text-sm text-gray-600'>Phí vận chuyển:</span>
        <span className={`text-sm font-medium ${colors.text}`}>
          {breakdown.shippingResponsibility} chịu trách nhiệm
        </span>
      </div>

      {/* Detailed Breakdown */}
      <div className='border-t pt-3 space-y-3'>
        {/* Original Order Value */}
        <div className='bg-gray-50 p-3 rounded-lg space-y-2'>
          <h4 className='text-xs font-medium text-gray-700 mb-2'>Chi tiết tính toán:</h4>

          <div className='flex justify-between items-center text-xs'>
            <span className='text-gray-600'>Giá trị hàng hóa trả:</span>
            <span>{formatPrice(breakdown.refundAmount / 0.9)}</span>
          </div>

          <div className='flex justify-between items-center text-xs'>
            <span className='text-gray-600'>Hoàn tiền hàng hóa (90%):</span>
            <span className='text-green-600'>+{formatPrice(breakdown.refundAmount)}</span>
          </div>
        </div>

        {/* Fees Breakdown */}
        <div className='space-y-2'>
          <div className='flex justify-between items-center text-xs'>
            <span className='text-gray-500'>Phí vận chuyển trả hàng:</span>
            <span>{formatPrice(breakdown.returnShippingFee)}</span>
          </div>

          {breakdown.customerShippingFee > 0 && (
            <div className='flex justify-between items-center text-xs'>
              <span className='text-gray-500'>Khách hàng trả phí ship:</span>
              <span className='text-red-600 font-medium'>-{formatPrice(breakdown.customerShippingFee)}</span>
            </div>
          )}

          {breakdown.processingFee > 0 && (
            <div className='flex justify-between items-center text-xs'>
              <span className='text-gray-500'>Phí xử lý (10%):</span>
              <span className='text-red-600 font-medium'>-{formatPrice(breakdown.processingFee)}</span>
            </div>
          )}
        </div>

        {/* Final Result */}
        <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
          <div className='flex justify-between items-center text-sm font-medium'>
            <span>Số tiền khách nhận được:</span>
            <span className='text-green-600 text-lg'>{formatPrice(breakdown.totalRefund)}</span>
          </div>

          {breakdown.reason === 'CHANGE_MIND' && (
            <div className='mt-2 pt-2 border-t border-green-200'>
              <p className='text-xs text-green-700'>
                <strong>Lưu ý:</strong> Với lý do "đổi ý không muốn mua", khách hàng sẽ mất:
              </p>
              <ul className='text-xs text-green-700 mt-1 ml-3'>
                <li>• 10% phí xử lý: {formatPrice(breakdown.processingFee)}</li>
                <li>• Phí ship trả hàng: {formatPrice(breakdown.customerShippingFee)}</li>
                <li>
                  • <strong>Tổng mất: {formatPrice(breakdown.processingFee + breakdown.customerShippingFee)}</strong>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Approval Notice */}
      {breakdown.requiresApproval && (
        <div className='flex items-start gap-2 mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded'>
          <MdInfo className='text-yellow-600 mt-0.5' size={16} />
          <p className='text-yellow-800 text-xs'>Yêu cầu trả hàng này cần được admin phê duyệt trước khi xử lý.</p>
        </div>
      )}
    </div>
  );
};

export default ReturnShippingBreakdown;
