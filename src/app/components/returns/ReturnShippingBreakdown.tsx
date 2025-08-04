'use client';

import { useState, useEffect } from 'react';
import { formatPrice } from '../../utils/formatPrice';
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

      {/* Clean, Professional Breakdown */}
      <div className='border-t pt-4 space-y-4'>
        {/* Detailed Calculation - Similar to AdminSettingsClient.tsx */}
        <div className='bg-white rounded-xl border p-4'>
          <h4 className='text-base font-semibold text-gray-800 mb-3'>Chi tiết tính toán</h4>

          <div className='space-y-2 text-sm'>
            {/* Product Value */}
            <div className='flex justify-between items-center py-1'>
              <span className='text-gray-600'>Giá trị hàng hóa:</span>
              <span className='font-medium'>{formatPrice(breakdown.refundAmount / 0.9)}</span>
            </div>

            {/* Refund Amount (90% or 100%) */}
            <div className='flex justify-between items-center py-1'>
              <span className='text-gray-600'>
                Hoàn tiền hàng ({breakdown.reason === 'CHANGE_MIND' ? '90%' : '100%'}):
              </span>
              <span className='font-medium text-green-600'>+{formatPrice(breakdown.refundAmount)}</span>
            </div>

            {/* Processing Fee */}
            {breakdown.processingFee > 0 && (
              <div className='flex justify-between items-center py-1'>
                <span className='text-gray-600'>Phí xử lý (10%):</span>
                <span className='font-medium text-red-600'>-{formatPrice(breakdown.processingFee)}</span>
              </div>
            )}

            {/* Shipping Fee */}
            {breakdown.customerShippingFee > 0 && (
              <div className='flex justify-between items-center py-1'>
                <span className='text-gray-600'>Phí ship trả hàng:</span>
                <span className='font-medium text-red-600'>-{formatPrice(breakdown.customerShippingFee)}</span>
              </div>
            )}

            {/* Final Result */}
            <div className='border-t border-gray-200 pt-2 mt-3'>
              <div className='flex justify-between items-center'>
                <span className='font-medium text-gray-700'>Khách nhận được:</span>
                <span className='font-bold text-green-600'>{formatPrice(breakdown.totalRefund)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Policy Note - Only for Change Mind */}
        {breakdown.reason === 'CHANGE_MIND' && (
          <div className='bg-amber-50 border border-amber-200 rounded-xl p-4'>
            <div className='flex items-start gap-3'>
              <div className='w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5'>
                <span className='text-amber-600 text-xs'>!</span>
              </div>
              <div>
                <h5 className='text-sm font-medium text-amber-800 mb-1'>Chính sách trả hàng do đổi ý</h5>
                <p className='text-xs text-amber-700 leading-relaxed'>
                  Khi trả hàng do đổi ý, khách hàng sẽ chịu phí xử lý 10% và phí vận chuyển. Chính sách này giúp bảo vệ
                  lợi ích cửa hàng và ngăn chặn việc đổi ý tùy tiện.
                </p>
              </div>
            </div>
          </div>
        )}
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
