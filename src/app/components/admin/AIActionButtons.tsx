'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface ActionButton {
  label: string;
  action: string;
  value?: any;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

interface AIActionButtonsProps {
  productId?: string;
  productName?: string;
  suggestionType: 'PROMOTION_SUGGESTION' | 'PRIORITY_BOOST' | 'STOCK_ALERT' | 'MARKETING_PUSH';
  suggestedAction: any;
  confidence: number;
  onActionTaken?: (action: string, value: any) => void;
}

export default function AIActionButtons({
  productId,
  productName,
  suggestionType,
  suggestedAction,
  confidence,
  onActionTaken
}: AIActionButtonsProps) {
  const router = useRouter();

  // Generate action buttons based on suggestion type - SIMPLIFIED
  const getActionButtons = (): ActionButton[] => {
    // Đơn giản hóa: chỉ có 2 actions chính
    return [
      {
        label: 'Xem chi tiết',
        action: 'view_details',
        value: productId,
        variant: 'primary'
      },
      {
        label: 'Email marketing',
        action: 'email_marketing',
        value: productId,
        variant: 'secondary'
      }
    ];
  };

  // Handle action button clicks - SIMPLIFIED
  const handleAction = async (button: ActionButton) => {
    try {
      switch (button.action) {
        case 'email_marketing':
          // Redirect to email marketing
          router.push(`/admin/manage-products?openEmailModal=true`);
          toast.success('Mở email marketing');
          break;

        case 'view_details':
        default:
          // Redirect to product details
          router.push(`/admin/manage-products?view=${productId}`);
          toast.success('Xem chi tiết sản phẩm');
          break;
      }

      // Track action taken
      if (onActionTaken) {
        onActionTaken(button.action, button.value);
      }

      // Track in analytics (optional)
      console.log(`AI Action taken: ${button.action} for product ${productId} (confidence: ${confidence}%)`);
    } catch (error) {
      console.error('Error handling AI action:', error);
      toast.error('Có lỗi xảy ra khi thực hiện hành động');
    }
  };

  const actionButtons = getActionButtons();

  // Get button styling based on variant
  const getButtonClass = (variant: string = 'secondary') => {
    const baseClass = 'px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 hover:shadow-sm';

    switch (variant) {
      case 'primary':
        return `${baseClass} bg-blue-600 text-white hover:bg-blue-700`;
      case 'success':
        return `${baseClass} bg-green-600 text-white hover:bg-green-700`;
      case 'warning':
        return `${baseClass} bg-yellow-600 text-white hover:bg-yellow-700`;
      case 'danger':
        return `${baseClass} bg-red-600 text-white hover:bg-red-700`;
      case 'secondary':
      default:
        return `${baseClass} bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300`;
    }
  };

  return (
    <div className='my-2 space-y-2'>
      {/* Action buttons */}
      <div className='flex flex-wrap gap-2'>
        {actionButtons.map((button, index) => (
          <button
            key={index}
            onClick={() => handleAction(button)}
            className={getButtonClass(button.variant)}
            title={button.label}
          >
            {button.label}
          </button>
        ))}
      </div>

      {/* Product info */}
      {/* {productName && <div className='text-xs text-gray-400 mt-1'>Sản phẩm: {productName}</div>} */}
    </div>
  );
}
