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

  // Generate action buttons based on suggestion type
  const getActionButtons = (): ActionButton[] => {
    switch (suggestionType) {
      case 'PROMOTION_SUGGESTION':
        return [
          {
            label: `Giảm ${suggestedAction.discountPercentage}%`,
            action: 'apply_discount',
            value: suggestedAction.discountPercentage,
            variant: 'warning'
          },
          {
            label: 'Xem sản phẩm',
            action: 'view_product',
            value: productId,
            variant: 'secondary'
          }
        ];

      case 'PRIORITY_BOOST':
        return [
          {
            label: `Tăng priority → ${suggestedAction.newPriority}`,
            action: 'boost_priority',
            value: suggestedAction.newPriority,
            variant: 'success'
          },
          {
            label: 'Quản lý sản phẩm',
            action: 'manage_product',
            value: productId,
            variant: 'secondary'
          }
        ];

      case 'STOCK_ALERT':
        return [
          {
            label: 'Nhập hàng',
            action: 'restock',
            value: suggestedAction.suggestedQuantity || 20,
            variant: 'primary'
          },
          {
            label: 'Xem inventory',
            action: 'view_inventory',
            value: productId,
            variant: 'secondary'
          }
        ];

      case 'MARKETING_PUSH':
        return [
          {
            label: 'Tạo campaign',
            action: 'create_campaign',
            value: suggestedAction,
            variant: 'success'
          },
          {
            label: 'Email marketing',
            action: 'email_marketing',
            value: productId,
            variant: 'primary'
          }
        ];

      default:
        return [
          {
            label: 'Xem chi tiết',
            action: 'view_details',
            value: productId,
            variant: 'secondary'
          }
        ];
    }
  };

  // Handle action button clicks
  const handleAction = async (button: ActionButton) => {
    try {
      switch (button.action) {
        case 'apply_discount':
          // Redirect to product edit page with discount suggestion
          router.push(`/admin/manage-products?edit=${productId}&suggested_discount=${button.value}`);
          toast.success(`Chuyển đến trang chỉnh sửa với đề xuất giảm ${button.value}%`);
          break;

        case 'boost_priority':
          // Redirect to product edit page with priority suggestion
          router.push(`/admin/manage-products?edit=${productId}&suggested_priority=${button.value}`);
          toast.success(`Chuyển đến trang chỉnh sửa với đề xuất priority ${button.value}`);
          break;

        case 'restock':
          // Redirect to inventory management
          router.push(`/admin/manage-products?restock=${productId}&suggested_quantity=${button.value}`);
          toast.success(`Chuyển đến trang nhập hàng với đề xuất ${button.value} cái`);
          break;

        case 'create_campaign':
          // Redirect to email marketing with pre-filled data
          router.push(`/admin/manage-products?email_campaign=${productId}`);
          toast.success('Chuyển đến trang tạo email campaign');
          break;

        case 'email_marketing':
          // Redirect to email marketing
          router.push(`/admin/manage-products?tab=email&product=${productId}`);
          toast.success('Chuyển đến email marketing');
          break;

        case 'view_product':
        case 'manage_product':
          // Redirect to product management
          router.push(`/admin/manage-products?edit=${productId}`);
          break;

        case 'view_inventory':
          // Redirect to inventory view
          router.push(`/admin/manage-products?filter=low_stock`);
          break;

        case 'view_details':
        default:
          // Redirect to product details
          router.push(`/admin/manage-products?view=${productId}`);
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
