'use client';

import { useState, useEffect } from 'react';
import { formatPrice } from '../../../../utils/formatPrice';
import Image from 'next/image';
import { MdSearch, MdSwapHoriz } from 'react-icons/md';
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

interface ExchangeProductInlineSelectorProps {
  currentProduct: any;
  onSelect: (product: Product, variant?: ProductVariant) => void;
}

const ExchangeProductInlineSelector: React.FC<ExchangeProductInlineSelectorProps> = ({
  currentProduct,
  onSelect
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [showProductList, setShowProductList] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
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
    setShowProductList(false);
    
    // If product has no variants, select immediately
    if (!product.variants || product.variants.length === 0) {
      onSelect(product);
    }
  };

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    if (selectedProduct) {
      onSelect(selectedProduct, variant);
    }
  };

  const getProductPrice = (product: Product, variant?: ProductVariant) => {
    return variant ? variant.price : product.price;
  };

  const calculatePriceDifference = (product: Product, variant?: ProductVariant) => {
    const newPrice = getProductPrice(product, variant);
    const oldPrice = currentProduct.price;
    return newPrice - oldPrice;
  };

  return (
    <div className='space-y-4'>
      {/* Search and Toggle */}
      <div className='flex gap-3'>
        <div className='flex-1 relative'>
          <MdSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' size={20} />
          <input
            type='text'
            placeholder='Tìm kiếm sản phẩm để đổi...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onFocus={() => setShowProductList(true)}
            className='w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500'
          />
        </div>
        <button
          onClick={() => setShowProductList(!showProductList)}
          className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2'
        >
          <MdSwapHoriz size={20} />
          Chọn sản phẩm
        </button>
      </div>

      {/* Product List */}
      {showProductList && (
        <div className='border rounded-lg bg-white shadow-lg max-h-96 overflow-hidden'>
          {isLoading ? (
            <div className='text-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
              <p className='mt-2 text-gray-600'>Đang tải...</p>
            </div>
          ) : (
            <div className='max-h-96 overflow-y-auto'>
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className='p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0'
                  onClick={() => handleProductSelect(product)}
                >
                  <div className='flex items-center gap-3'>
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
                    <div className='text-right'>
                      <div className={`text-xs px-2 py-1 rounded ${
                        calculatePriceDifference(product) >= 0 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {calculatePriceDifference(product) >= 0 ? '+' : ''}
                        {formatPrice(calculatePriceDifference(product))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Variant Selection */}
      {selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0 && (
        <div className='border rounded-lg p-4 bg-gray-50'>
          <h4 className='font-medium text-gray-700 mb-3'>Chọn phiên bản cho {selectedProduct.name}:</h4>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
            {selectedProduct.variants.map(variant => (
              <div
                key={variant.id}
                onClick={() => handleVariantSelect(variant)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedVariant?.id === variant.id
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-white border-2 border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className='flex justify-between items-center'>
                  <div>
                    <p className='font-medium text-sm'>{variant.name}</p>
                    {variant.color && <p className='text-xs text-gray-500'>Màu: {variant.color}</p>}
                    {variant.size && <p className='text-xs text-gray-500'>Size: {variant.size}</p>}
                  </div>
                  <div className='text-right'>
                    <p className='font-medium text-sm'>{formatPrice(variant.price)}</p>
                    <p className='text-xs text-gray-500'>Còn: {variant.stock}</p>
                    <div className={`text-xs px-2 py-1 rounded mt-1 ${
                      calculatePriceDifference(selectedProduct, variant) >= 0 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {calculatePriceDifference(selectedProduct, variant) >= 0 ? '+' : ''}
                      {formatPrice(calculatePriceDifference(selectedProduct, variant))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExchangeProductInlineSelector;
