'use client';

import Image from 'next/image';
import { truncateText } from '../../../../utils/truncateText';
import { formatPrice } from '../../../../utils/formatPrice';

import ProductVariantSelector from './ProductVariantSelector';
import { useCallback, useState } from 'react';
import { CartProductType, selectedImgType } from '@/app/(home)/product/[productId]/ProductDetails';
import Link from 'next/link';
import { slugConvert } from '../../../../utils/Slug';
import { useAnalyticsTracker } from '@/app/hooks/useAnalytics';
import { getDefaultImage } from '../../../../utils/product';

interface ProductCardProps {
  data: any;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ data, className }) => {
  // Hàm trả về số reviews trung bình
  // const productRating = data.reviews.reduce((acc: number, item: any) => item.rating + acc, 0) / data.reviews.length;
  // Check color hiện tại và img thay đổi theo color đc select
  const { trackProductInteraction } = useAnalyticsTracker();

  // Enhanced image access for both Simple and Variant products - using new structure

  // Helper function to create display label for variant
  const getVariantDisplayLabel = (attributes: Record<string, string> = {}): string => {
    const attributeValues = Object.values(attributes).filter(Boolean);
    return attributeValues.length > 0 ? attributeValues.join(' - ') : 'Biến thể';
  };

  // Get default image using utility function
  const defaultImage = getDefaultImage(data);

  // For variant products, get first variant data for cart
  const getDefaultVariantData = () => {
    if (data.productType === 'VARIANT' && data.variants && data.variants.length > 0) {
      const firstVariant = data.variants[0];
      return {
        variantId: firstVariant.id,
        attributes: firstVariant.attributes || {},
        price: firstVariant.price || data.price
      };
    }
    return {
      variantId: undefined,
      attributes: {},
      price: data.price
    };
  };

  const defaultVariantData = getDefaultVariantData();

  const [cartProduct, setCartProduct] = useState<CartProductType>({
    id: data.id,
    name: data.name,
    description: data.description,
    category: data.category,
    selectedImg: defaultImage,
    thumbnail: defaultImage,
    quantity: 1,
    price: defaultVariantData.price,
    inStock: data.inStock,
    variantId: defaultVariantData.variantId,
    attributes: defaultVariantData.attributes
  });

  // Check if product is new (created within last 30 days)
  const isNewProduct = () => {
    const productDate = new Date(data.createdAt || Date.now());
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return productDate >= thirtyDaysAgo;
  };

  // Check if product has active promotions and display sale tag
  const isOnSale = () => {
    if (!data.productPromotions || data.productPromotions.length === 0) {
      return false;
    }

    const now = new Date();
    const activePromotion = data.productPromotions.find((promo: any) => {
      const startDate = new Date(promo.startDate);
      const endDate = new Date(promo.endDate);
      return promo.isActive && now >= startDate && now <= endDate && promo.promotionalPrice < data.price;
    });

    return !!activePromotion;
  };

  // Get the best promotional price from active promotions
  const getBestPromotionalPrice = () => {
    if (!data.productPromotions || data.productPromotions.length === 0) return null;

    const now = new Date();
    const activePromotions = data.productPromotions.filter((promo: any) => {
      const startDate = new Date(promo.startDate);
      const endDate = new Date(promo.endDate);
      return promo.isActive && now >= startDate && now <= endDate;
    });

    if (activePromotions.length === 0) return null;

    // Sort by priority (higher first), then by lowest price
    activePromotions.sort((a: any, b: any) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.promotionalPrice - b.promotionalPrice;
    });

    return activePromotions[0].promotionalPrice;
  };

  const handleColorSelect = useCallback((value: selectedImgType) => {
    setCartProduct(prev => {
      return {
        ...prev,
        selectedImg: value.selectedImg || value.images?.[0] || '/noavatar.png',
        thumbnail: value.selectedImg || value.images?.[0] || '/noavatar.png',
        variantId: value.variantId,
        attributes: value.attributes
      };
    });
  }, []);

  const handleProductClick = (product: any) => {
    if (!product) return;

    try {
      // Track product view analytics only
      trackProductInteraction(product.id, {
        productName: product.name,
        category: product.category,
        price: product.price,
        clickSource: 'ProductCard',
        interactionType: 'view'
      });
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  };

  return (
    <div
      className={`col-span-1 cursor-pointer border-[1.2px] border-none bg-white p-2 transition hover:rounded-lg hover:scale-105 text-center text-sm ${className}`}
    >
      <Link
        href={`/product/${slugConvert(data.name)}-${data.id}`}
        onClick={() => handleProductClick(data)}
        className='flex flex-col items-center gap-1 w-full'
      >
        <div className='aspect-square overflow-hidden relative w-full'>
          <Image
            src={cartProduct.selectedImg || '/noavatar.png'}
            alt={data.name}
            fill
            sizes='100%'
            className='w-full h-full object-cover'
            loading='lazy'
            onError={e => {
              e.currentTarget.src = '/noavatar.png';
            }}
          />

          {/* Product Tags */}
          <div className='absolute top-2 left-2 flex flex-col gap-1 z-10'>
            {/* {isNewProduct() && (
              <div className='bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform -rotate-12 border border-green-400'>
                NEW
              </div>
            )} */}
            {isOnSale() && (
              <div className='bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform -rotate-12 border border-red-400'>
                SALE
              </div>
            )}
          </div>
        </div>
        <div className='mt-3 text-base h-11'>{truncateText(data.name)}</div>
        <div className='font-semibold text-lg mt-2'>
          {isOnSale() ? (
            <div className='flex flex-col items-center gap-1'>
              <span className='text-red-600'>{formatPrice(getBestPromotionalPrice())}</span>
              <span className='text-gray-500 line-through text-sm'>{formatPrice(data.price)}</span>
            </div>
          ) : (
            formatPrice(data.price)
          )}
        </div>
      </Link>
      {/* Only show ProductVariantSelector for VARIANT products, not SIMPLE products */}
      {/* {data.productType === 'VARIANT' && (
        <div className='py-4 px-14'>
          <ProductVariantSelector
            cartProduct={cartProduct}
            product={data}
            handleColorSelect={handleColorSelect}
            performance={true}
          />
        </div>
      )} */}
      {/* <div>
		<Rating value={productRating} />
	</div> */}
      {/* <div>{data.reviews.length} reviews</div> */}
    </div>
  );
};

export default ProductCard;
