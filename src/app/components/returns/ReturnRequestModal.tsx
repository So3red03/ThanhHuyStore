'use client';

import { useState } from 'react';
import { Order } from '@prisma/client';
import { SafeUser } from '../../../../types';
import AdminModal from '../admin/AdminModal';
import { formatPrice } from '../../../../utils/formatPrice';
import Image from 'next/image';
import { MdCloudUpload, MdDelete } from 'react-icons/md';
import toast from 'react-hot-toast';
import axios from 'axios';
import ExchangeProductInlineSelector from './ExchangeProductInlineSelector';
import ReturnShippingBreakdown from './ReturnShippingBreakdown';

interface ReturnRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order & {
    user: SafeUser;
    products: any[];
  };
  currentUser: SafeUser;
  type: 'RETURN' | 'EXCHANGE';
  onReturnRequested: () => void;
}

interface SelectedItem {
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  reason: string;
  maxQuantity: number;
  name: string;
  image: string;
  variantInfo?: string;
}

const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({
  isOpen,
  onClose,
  order,
  currentUser,
  type,
  onReturnRequested
}) => {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Exchange specific states
  const [exchangeProduct, setExchangeProduct] = useState<any>(null);
  const [exchangeVariant, setExchangeVariant] = useState<any>(null);

  const reasonOptions = [
    { value: 'DEFECTIVE', label: 'Sản phẩm bị lỗi/hỏng', refundRate: '100%' },
    { value: 'WRONG_ITEM', label: 'Giao sai sản phẩm', refundRate: '100%' },
    { value: 'CHANGE_MIND', label: 'Đổi ý không muốn mua', refundRate: '95%' }
  ];

  const handleItemSelect = (product: any, isSelected: boolean) => {
    // First check current state to prevent logic errors
    const existingItem = selectedItems.find(
      item => item.productId === product.id && item.variantId === product.variantId
    );

    if (isSelected) {
      // Adding item - check if already exists
      if (existingItem) {
        // Item already exists, don't add duplicate - show warning
        toast.error('Sản phẩm này đã được chọn');
        return;
      }

      const newItem: SelectedItem = {
        productId: product.id,
        variantId: product.variantId || undefined,
        quantity: 1,
        unitPrice: product.price,
        reason: '',
        maxQuantity: product.quantity,
        name: product.name,
        image: product.selectedImg || product.thumbnail || '/placeholder.jpg',
        variantInfo: product.variantInfo || ''
      };
      setSelectedItems(prev => [...prev, newItem]);
    } else {
      // Removing item - check if exists before removing
      if (!existingItem) {
        // Item doesn't exist, nothing to remove
        return;
      }

      setSelectedItems(prev =>
        prev.filter(item => !(item.productId === product.id && item.variantId === product.variantId))
      );
    }
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const updated = [...selectedItems];
    updated[index].quantity = Math.max(1, Math.min(quantity, updated[index].maxQuantity));
    setSelectedItems(updated);
  };

  const updateItemReason = (index: number, reason: string) => {
    const updated = [...selectedItems];
    updated[index].reason = reason;
    setSelectedItems(updated);
  };

  const calculateRefund = () => {
    return selectedItems.reduce((total, item) => {
      const itemTotal = item.unitPrice * item.quantity;
      // Use item's individual reason if available, otherwise use general reason
      const effectiveReason = item.reason || reason;
      const refundRate = effectiveReason === 'DEFECTIVE' || effectiveReason === 'WRONG_ITEM' ? 1.0 : 0.95;
      return total + itemTotal * refundRate;
    }, 0);
  };

  const calculateExchangeDifference = () => {
    if (!exchangeProduct || selectedItems.length === 0) return 0;

    const oldTotal = selectedItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
    const newPrice = exchangeVariant ? exchangeVariant.price : exchangeProduct.price;

    return newPrice - oldTotal;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Limit to 3 images
    if (images.length + files.length > 3) {
      toast.error('Chỉ được tải lên tối đa 3 ảnh');
      return;
    }

    // Convert to base64 or upload to storage
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        if (e.target?.result) {
          setImages(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Enhanced validation with better error messages
    if (selectedItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm để ' + (type === 'RETURN' ? 'trả hàng' : 'đổi hàng'));
      return;
    }

    // For exchange, check if exchange product is selected
    if (type === 'EXCHANGE' && !exchangeProduct) {
      toast.error('Vui lòng chọn sản phẩm để đổi');
      return;
    }

    // Improved validation logic: Check if either general reason OR all items have individual reasons
    const hasGeneralReason = reason && reason.trim() !== '';
    const itemsWithoutReason = selectedItems.filter(item => !item.reason || item.reason.trim() === '');
    const allItemsHaveReasons = itemsWithoutReason.length === 0;

    if (!hasGeneralReason && !allItemsHaveReasons) {
      toast.error('Vui lòng chọn lý do chung HOẶC chọn lý do riêng cho từng sản phẩm');
      return;
    }

    // If no general reason but some items missing individual reasons, show specific error
    if (!hasGeneralReason && itemsWithoutReason.length > 0) {
      toast.error(`Vui lòng chọn lý do cho ${itemsWithoutReason.length} sản phẩm chưa có lý do`);
      return;
    }

    setIsLoading(true);

    try {
      const requestData = {
        orderId: order.id,
        type,
        items: selectedItems.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          reason: item.reason
        })),
        reason,
        description,
        images,
        // Exchange specific data
        ...(type === 'EXCHANGE' &&
          exchangeProduct && {
            exchangeToProductId: exchangeProduct.id,
            exchangeToVariantId: exchangeVariant?.id
          })
      };

      await axios.post('/api/orders/return-request', requestData);

      toast.success(`Yêu cầu ${type === 'RETURN' ? 'trả hàng' : 'đổi hàng'} đã được gửi thành công`);
      onReturnRequested();
    } catch (error: any) {
      console.error('Error creating return request:', error);
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  const isItemSelected = (product: any) => {
    return selectedItems.some(item => item.productId === product.id && item.variantId === product.variantId);
  };

  return (
    <AdminModal isOpen={isOpen} handleClose={onClose}>
      <div className='max-w-4xl mx-auto p-4 sm:p-6'>
        {/* Header */}
        <div className='mb-6'>
          <h2 className='text-xl sm:text-2xl font-bold text-gray-900 mb-2'>
            {type === 'RETURN' ? 'Yêu cầu trả hàng' : 'Yêu cầu đổi hàng'}
          </h2>
          <p className='text-sm sm:text-base text-gray-600'>
            Đơn hàng #{order.id.substring(0, 8)} - {order.products.length} sản phẩm
          </p>
        </div>

        {/* Step 1: Select Products */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold mb-4'>1. Chọn sản phẩm muốn {type === 'RETURN' ? 'trả' : 'đổi'}</h3>
          <div className='space-y-4 max-h-60 overflow-y-auto border rounded-lg p-4'>
            {order.products.map((product: any) => {
              const selected = isItemSelected(product);
              const selectedItem = selectedItems.find(
                item => item.productId === product.id && item.variantId === product.variantId
              );

              return (
                <div
                  key={`${product.id}-${product.variantId || 'simple'}`}
                  className={`flex items-center p-3 border rounded-lg transition-colors ${
                    selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <input
                    type='checkbox'
                    checked={selected}
                    onChange={e => handleItemSelect(product, e.target.checked)}
                    className='mr-4 h-5 w-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2'
                  />

                  <Image
                    src={product.selectedImg || product.thumbnail || '/placeholder.jpg'}
                    alt={product.name}
                    width={60}
                    height={60}
                    className='rounded-lg mr-4'
                  />

                  <div className='flex-1'>
                    <h4 className='font-medium'>{product.name}</h4>
                    {product.variantInfo && <p className='text-sm text-gray-500'>{product.variantInfo}</p>}
                    <p className='text-sm text-gray-600'>
                      {formatPrice(product.price)} x {product.quantity}
                    </p>
                  </div>

                  {selected && selectedItem && (
                    <div className='flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mt-3'>
                      {/* Quantity Selector */}
                      <div className='flex items-center gap-2'>
                        <label className='text-sm font-medium whitespace-nowrap'>Số lượng:</label>
                        <input
                          type='number'
                          min='1'
                          max={selectedItem.maxQuantity}
                          value={selectedItem.quantity}
                          onChange={e =>
                            updateItemQuantity(selectedItems.indexOf(selectedItem), parseInt(e.target.value))
                          }
                          className='w-16 px-2 py-1 border rounded text-center'
                        />
                      </div>

                      {/* Reason Selector */}
                      <div className='flex items-center gap-2 flex-1'>
                        <label className='text-sm font-medium whitespace-nowrap'>Lý do:</label>
                        <select
                          value={selectedItem.reason}
                          onChange={e => updateItemReason(selectedItems.indexOf(selectedItem), e.target.value)}
                          className='flex-1 sm:flex-none px-3 py-1 border rounded text-sm min-w-0'
                        >
                          <option value=''>Chọn lý do</option>
                          {reasonOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label} ({option.refundRate})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Exchange Product Selection (only for EXCHANGE) - Integrated Design */}
        {type === 'EXCHANGE' && selectedItems.length > 0 && (
          <div className='mb-8'>
            <h3 className='text-lg font-semibold mb-4'>2. Chọn sản phẩm để đổi</h3>

            {!exchangeProduct ? (
              <ExchangeProductInlineSelector
                currentProduct={selectedItems[0]}
                onSelect={(product, variant) => {
                  setExchangeProduct(product);
                  setExchangeVariant(variant);
                }}
              />
            ) : (
              <div className='border rounded-lg p-4 bg-blue-50'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-4'>
                    <Image
                      src={exchangeProduct.thumbnail || '/placeholder.jpg'}
                      alt={exchangeProduct.name}
                      width={60}
                      height={60}
                      className='rounded-lg'
                    />
                    <div>
                      <h4 className='font-medium'>{exchangeProduct.name}</h4>
                      {exchangeVariant && <p className='text-sm text-gray-600'>{exchangeVariant.name}</p>}
                      <p className='text-sm font-medium text-blue-600'>
                        {formatPrice(exchangeVariant ? exchangeVariant.price : exchangeProduct.price)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setExchangeProduct(null);
                      setExchangeVariant(null);
                    }}
                    className='px-3 py-1 text-blue-600 hover:text-blue-800 text-sm border border-blue-300 rounded-lg hover:bg-blue-100'
                  >
                    Đổi sản phẩm khác
                  </button>
                </div>

                {/* Price Difference */}
                <div className='mt-4 p-3 bg-white rounded-lg border'>
                  <h4 className='font-medium text-gray-700 mb-2'>Chênh lệch giá:</h4>
                  <div className='space-y-1 text-sm'>
                    <div className='flex justify-between'>
                      <span>Sản phẩm cũ:</span>
                      <span>
                        {formatPrice(selectedItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0))}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Sản phẩm mới:</span>
                      <span>{formatPrice(exchangeVariant ? exchangeVariant.price : exchangeProduct.price)}</span>
                    </div>
                    <div className='flex justify-between font-medium border-t pt-1'>
                      <span>Chênh lệch:</span>
                      <span className={calculateExchangeDifference() >= 0 ? 'text-orange-600' : 'text-green-600'}>
                        {calculateExchangeDifference() >= 0 ? '+' : ''}
                        {formatPrice(calculateExchangeDifference())}
                      </span>
                    </div>
                    {calculateExchangeDifference() > 0 && (
                      <p className='text-xs text-orange-600 mt-2'>
                        * Bạn cần thanh toán thêm {formatPrice(calculateExchangeDifference())}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: General Reason & Description */}
        {selectedItems.length > 0 && (type === 'RETURN' || (type === 'EXCHANGE' && exchangeProduct)) && (
          <div className='mb-8'>
            <h3 className='text-lg font-semibold mb-4'>{type === 'EXCHANGE' ? '3' : '2'}. Thông tin chi tiết</h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm font-medium mb-2'>Lý do chung</label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                  required
                >
                  <option value=''>Chọn lý do chung</option>
                  {reasonOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium mb-2'>Mô tả chi tiết (tùy chọn)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder='Mô tả thêm về vấn đề...'
                  className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Upload Images */}
        {selectedItems.length > 0 && (type === 'RETURN' || (type === 'EXCHANGE' && exchangeProduct)) && (
          <div className='mb-8'>
            <h3 className='text-lg font-semibold mb-4'>
              {type === 'EXCHANGE' ? '4' : '3'}. Hình ảnh chứng minh (tùy chọn)
            </h3>

            <div
              className='border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 cursor-pointer'
              onClick={() => document.getElementById('image-upload')?.click()}
              onDragOver={e => {
                e.preventDefault();
                e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
              }}
              onDragLeave={e => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
              }}
              onDrop={e => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                const files = e.dataTransfer.files;
                if (files && files.length > 0) {
                  // Create a synthetic event to reuse handleImageUpload
                  const syntheticEvent = {
                    target: { files }
                  } as React.ChangeEvent<HTMLInputElement>;
                  handleImageUpload(syntheticEvent);
                }
              }}
            >
              <div className='text-center'>
                <MdCloudUpload className='mx-auto h-12 w-12 text-gray-400' />
                <div className='mt-4'>
                  <p className='text-lg font-medium text-gray-900 mb-2'>Kéo thả ảnh vào đây hoặc click để chọn</p>
                  <p className='text-sm text-gray-600'>Hỗ trợ: JPG, PNG, GIF (tối đa 3 ảnh)</p>
                  <input
                    id='image-upload'
                    type='file'
                    multiple
                    accept='image/*'
                    onChange={handleImageUpload}
                    className='hidden'
                  />
                </div>
              </div>

              {images.length > 0 && (
                <div className='mt-4 grid grid-cols-3 gap-4'>
                  {images.map((image, index) => (
                    <div key={index} className='relative'>
                      <Image
                        src={image}
                        alt={`Upload ${index + 1}`}
                        width={100}
                        height={100}
                        className='rounded-lg object-cover'
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600'
                      >
                        <MdDelete size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Return Shipping Breakdown */}
        {selectedItems.length > 0 && type === 'RETURN' && reason && (
          <div className='mb-8'>
            <ReturnShippingBreakdown
              orderId={order.id}
              reason={reason}
              items={selectedItems.map(item => ({
                id: item.productId,
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice
              }))}
            />
          </div>
        )}

        {/* Simple Summary for Exchange */}
        {selectedItems.length > 0 && type === 'EXCHANGE' && (
          <div className='mb-8 p-4 bg-gray-50 rounded-lg'>
            <h3 className='text-lg font-semibold mb-2'>Tóm tắt đổi hàng</h3>
            <div className='space-y-2'>
              {selectedItems.map((item, index) => (
                <div key={index} className='flex justify-between text-sm'>
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>{formatPrice(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
              <div className='border-t pt-2 flex justify-between font-semibold'>
                <span>Tổng giá trị:</span>
                <span className='text-blue-600'>{formatPrice(calculateRefund())}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className='flex flex-col sm:flex-row justify-end gap-3 sm:gap-4'>
          {/* Cancel Button */}
          <button
            onClick={onClose}
            disabled={isLoading}
            className='w-full sm:w-auto px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Hủy
          </button>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || selectedItems.length === 0}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              type === 'RETURN'
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isLoading ? (
              <div className='flex items-center justify-center gap-2'>
                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                <span>Đang xử lý...</span>
              </div>
            ) : (
              `Gửi yêu cầu ${type === 'RETURN' ? 'trả hàng' : 'đổi hàng'}`
            )}
          </button>
        </div>
      </div>
    </AdminModal>
  );
};

export default ReturnRequestModal;
