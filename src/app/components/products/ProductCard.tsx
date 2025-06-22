'use client';

import Image from 'next/image';
import { truncateText } from '../../../../utils/truncateText';
import { formatPrice } from '../../../../utils/formatPrice';
import { Rating } from '@mui/material';
import SetColor from './SetColor';
import { useCallback, useEffect, useState } from 'react';
import { CartProductType, selectedImgType } from '@/app/(home)/product/[productId]/ProductDetails';
import Link from 'next/link';
import { slugConvert } from '../../../../utils/Slug';
import { useAnalyticsTracker } from '@/app/hooks/useAnalytics';

interface ProductCardProps {
  data: any;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ data, className }) => {
  // Hàm trả về số reviews trung bình
  // const productRating = data.reviews.reduce((acc: number, item: any) => item.rating + acc, 0) / data.reviews.length;
  // Check color hiện tại và img thay đổi theo color đc select
  const { trackProductInteraction } = useAnalyticsTracker();

  const [cartProduct, setCartProduct] = useState<CartProductType>({
    id: data.id,
    name: data.name,
    description: data.description,
    category: data.category,
    selectedImg: { ...data.images[0] },
    quantity: 1,
    price: data.price,
    inStock: data.inStock
  });

  // Check if product is new (created within last 30 days)
  const isNewProduct = () => {
    const productDate = new Date(data.createDate || data.createdAt || Date.now());
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
      return { ...prev, selectedImg: value };
    });
  }, []);

  const [viewedProducts, setViewedProducts] = useState<CartProductType[] | null>(null);

  useEffect(() => {
    const syncViewedProducts = () => {
      const storedViewed = localStorage.getItem('viewedProducts');
      if (storedViewed) {
        setViewedProducts(JSON.parse(storedViewed));
      } else {
        setViewedProducts([]);
      }
    };

    // Lắng nghe sự kiện storage thay đổi
    window.addEventListener('storage', syncViewedProducts);

    // Gọi lần đầu khi component mount
    syncViewedProducts();
    return () => {
      window.removeEventListener('storage', syncViewedProducts);
    };
  }, []);

  const saveViewedProduct = useCallback(
    (product: any) => {
      if (!product) return;

      try {
        // Track product click analytics
        console.log('🎯 ProductCard: Tracking product click for:', product.id);
        trackProductInteraction('PRODUCT_CLICK', product.id, {
          productName: product.name,
          category: product.category,
          price: product.price,
          clickSource: 'ProductCard'
        });

        // Lưu theo format mới cho RecentlyViewedProducts
        const viewHistory = JSON.parse(localStorage.getItem('productViewHistory') || '[]');

        const newView = {
          productId: product.id,
          category: product.categoryId,
          brand: product.brand || 'Apple',
          viewedAt: Date.now()
        };

        // Loại bỏ view cũ của cùng sản phẩm
        const filteredHistory = viewHistory.filter((item: any) => item.productId !== product.id);

        // Thêm view mới và giữ tối đa 50 records
        const updatedHistory = [newView, ...filteredHistory].slice(0, 50);

        localStorage.setItem('productViewHistory', JSON.stringify(updatedHistory));

        // Vẫn giữ logic cũ cho backward compatibility
        setViewedProducts(prev => {
          const updatedViewed = prev?.filter(p => p.id !== product.id) || [];
          updatedViewed.unshift(product);

          if (updatedViewed.length > 8) {
            updatedViewed.pop();
          }

          localStorage.setItem('viewedProducts', JSON.stringify(updatedViewed));
          return updatedViewed;
        });
      } catch (error) {
        console.error('Error saving viewed product:', error);
      }
    },
    [trackProductInteraction]
  );

  return (
    <div
      className={`col-span-1 cursor-pointer border-[1.2px] border-none bg-white p-2 transition hover:rounded-lg hover:scale-105 text-center text-sm ${className}`}
    >
      <Link
        href={`/product/${slugConvert(data.name)}-${data.id}`}
        onClick={() => saveViewedProduct(data)}
        className='flex flex-col items-center gap-1 w-full'
      >
        <div className='aspect-square overflow-hidden relative w-full'>
          <Image
            src={cartProduct.selectedImg.images[0]}
            alt={data.name}
            fill
            sizes='100%'
            className='w-full h-full object-cover'
            loading='lazy'
          />

          {/* Product Tags */}
          <div className='absolute top-2 left-2 flex flex-col gap-1 z-10'>
            {isNewProduct() && (
              <div className='bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform -rotate-12 border border-green-400'>
                NEW
              </div>
            )}
            {isOnSale() && (
              <div className='bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform rotate-12 border border-red-400'>
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
      <div className='py-4 px-14'>
        <SetColor cartProduct={cartProduct} product={data} handleColorSelect={handleColorSelect} performance={true} />
      </div>
      {/* <div>
		<Rating value={productRating} />
	</div> */}
      {/* <div>{data.reviews.length} reviews</div> */}
    </div>
  );
};

export default ProductCard;
