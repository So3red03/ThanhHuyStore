'use client';

import { useState, useEffect } from 'react';
import { formatPrice } from '../../../../utils/formatPrice';
import Image from 'next/image';
import { MdSearch, MdClose } from 'react-icons/md';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  thumbnail: string;
  inStock: number;
  variants?: ProductVariant[];
}

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
  color?: string;
  size?: string;
}

interface ExchangeProductSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: Product, variant?: ProductVariant) => void;
  currentProduct: any;
}

const ExchangeProductSelector: React.FC<ExchangeProductSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentProduct
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(product => product.name.toLowerCase().includes(searchTerm.toLowerCase()));
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/product');
      const availableProducts = response.data.products.filter((product: Product) => {
        // Exclude current product and ensure stock availability
        if (product.id === currentProduct.productId) return false;

        // For simple products, check inStock
        if (product.inStock !== undefined && product.inStock > 0) return true;

        // For variant products, check if any variant has stock
        if (product.variants && product.variants.length > 0) {
          return product.variants.some((variant: ProductVariant) => variant.stock > 0);
        }

        return false;
      });
      setProducts(availableProducts);
      setFilteredProducts(availableProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Không thể tải danh sách sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSelectedVariant(null);
  };

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
  };

  const handleConfirmSelection = () => {
    if (selectedProduct) {
      onSelect(selectedProduct, selectedVariant || undefined);
      onClose();
    }
  };

  const getProductPrice = (product: Product, variant?: ProductVariant) => {
    return variant ? variant.price : product.price;
  };

  const calculatePriceDifference = () => {
    if (!selectedProduct) return 0;
    const newPrice = getProductPrice(selectedProduct, selectedVariant || undefined);
    const oldPrice = currentProduct.price;
    return newPrice - oldPrice;
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 sm:p-6 border-b'>
          <h2 className='text-lg sm:text-xl font-bold text-gray-900'>Chọn sản phẩm để đổi</h2>
          <button onClick={onClose} className='p-2 hover:bg-gray-100 rounded-lg'>
            <MdClose size={24} />
          </button>
        </div>

        {/* Current Product Info */}
        <div className='p-4 bg-gray-50 border-b'>
          <h3 className='font-medium text-gray-700 mb-2'>Sản phẩm hiện tại:</h3>
          <div className='flex items-center gap-3'>
            <Image
              src={currentProduct.selectedImg || currentProduct.thumbnail || '/placeholder.jpg'}
              alt={currentProduct.name}
              width={50}
              height={50}
              className='rounded-lg'
            />
            <div>
              <p className='font-medium'>{currentProduct.name}</p>
              <p className='text-sm text-gray-600'>{formatPrice(currentProduct.price)}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className='p-4 border-b'>
          <div className='relative'>
            <MdSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' size={20} />
            <input
              type='text'
              placeholder='Tìm kiếm sản phẩm...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
            />
          </div>
        </div>

        {/* Content */}
        <div className='flex flex-col sm:flex-row h-96'>
          {/* Product List */}
          <div className='w-full sm:w-1/2 border-b sm:border-b-0 sm:border-r overflow-y-auto'>
            <div className='p-4'>
              <h3 className='font-medium text-gray-700 mb-3'>Danh sách sản phẩm</h3>
              {isLoading ? (
                <div className='text-center py-8'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
                  <p className='mt-2 text-gray-600'>Đang tải...</p>
                </div>
              ) : (
                <div className='space-y-2'>
                  {filteredProducts.map(product => (
                    <div
                      key={product.id}
                      onClick={() => handleProductSelect(product)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedProduct?.id === product.id
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <Image
                        src={product.thumbnail || '/placeholder.jpg'}
                        alt={product.name}
                        width={50}
                        height={50}
                        className='rounded-lg'
                      />
                      <div className='flex-1'>
                        <p className='font-medium text-sm'>{product.name}</p>
                        <p className='text-sm text-gray-600'>{formatPrice(product.price)}</p>
                        <p className='text-xs text-gray-500'>Còn lại: {product.inStock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Details & Variants */}
          <div className='w-full sm:w-1/2 overflow-y-auto'>
            <div className='p-4'>
              {selectedProduct ? (
                <>
                  <h3 className='font-medium text-gray-700 mb-3'>Chi tiết sản phẩm</h3>

                  {/* Product Info */}
                  <div className='mb-4'>
                    <Image
                      src={selectedProduct.thumbnail || '/placeholder.jpg'}
                      alt={selectedProduct.name}
                      width={100}
                      height={100}
                      className='rounded-lg mb-3'
                    />
                    <h4 className='font-medium'>{selectedProduct.name}</h4>
                    <p className='text-gray-600'>{formatPrice(selectedProduct.price)}</p>
                  </div>

                  {/* Variants */}
                  {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                    <div className='mb-4'>
                      <h4 className='font-medium text-gray-700 mb-2'>Chọn phiên bản:</h4>
                      <div className='space-y-2'>
                        {selectedProduct.variants.map(variant => (
                          <div
                            key={variant.id}
                            onClick={() => handleVariantSelect(variant)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedVariant?.id === variant.id
                                ? 'bg-blue-50 border-2 border-blue-500'
                                : 'hover:bg-gray-50 border-2 border-gray-200'
                            }`}
                          >
                            <div className='flex justify-between items-center'>
                              <div>
                                <p className='font-medium text-sm'>{variant.name}</p>
                                {variant.color && <p className='text-xs text-gray-500'>Màu: {variant.color}</p>}
                                {variant.size && <p className='text-xs text-gray-500'>Size: {variant.size}</p>}
                              </div>
                              <div className='text-right'>
                                <p className='font-medium'>{formatPrice(variant.price)}</p>
                                <p className='text-xs text-gray-500'>Còn: {variant.stock}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price Difference */}
                  <div className='p-3 bg-gray-50 rounded-lg mb-4'>
                    <h4 className='font-medium text-gray-700 mb-2'>Chênh lệch giá:</h4>
                    <div className='space-y-1 text-sm'>
                      <div className='flex justify-between'>
                        <span>Sản phẩm cũ:</span>
                        <span>{formatPrice(currentProduct.price)}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Sản phẩm mới:</span>
                        <span>{formatPrice(getProductPrice(selectedProduct, selectedVariant || undefined))}</span>
                      </div>
                      <div className='flex justify-between font-medium border-t pt-1'>
                        <span>Chênh lệch:</span>
                        <span className={calculatePriceDifference() >= 0 ? 'text-orange-600' : 'text-green-600'}>
                          {calculatePriceDifference() >= 0 ? '+' : ''}
                          {formatPrice(calculatePriceDifference())}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className='text-center py-8 text-gray-500'>
                  <p>Chọn một sản phẩm để xem chi tiết</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 p-4 sm:p-6 border-t bg-gray-50'>
          {/* Cancel Button */}
          <button
            onClick={onClose}
            className='w-full sm:w-auto px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200'
          >
            Hủy
          </button>

          {/* Confirm Button */}
          <button
            onClick={handleConfirmSelection}
            disabled={
              !selectedProduct || (selectedProduct.variants && selectedProduct.variants.length > 0 && !selectedVariant)
            }
            className='w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
          >
            Xác nhận chọn
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExchangeProductSelector;
