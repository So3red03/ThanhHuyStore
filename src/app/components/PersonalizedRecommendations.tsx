'use client';

import { useEffect, useState, useCallback } from 'react';
import { Product } from '@prisma/client';
import Container from './Container';
import ProductCard from './products/ProductCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

interface PersonalizedRecommendationsProps {
  allProducts: Product[];
  currentUser?: any;
}

interface ViewHistory {
  productId: string;
  category: string;
  brand: string;
  viewedAt: number;
}

interface GlobalTrendsData {
  trendingProducts: any[];
  collaborativeFiltering: Record<string, string[]>;
  categoryTrends: any[];
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
  metadata: {
    totalProducts: number;
    avgRating: number;
    totalViews: number;
  };
}

const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({ allProducts, currentUser }) => {
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Lấy sản phẩm ngẫu nhiên (fallback) - giới hạn 6 sản phẩm
  const getRecentProducts = useCallback((): Product[] => {
    const recentProducts = allProducts
      .filter(product => (product.inStock ?? 0) > 0)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6); // Limit to 6 products

    return recentProducts.length > 0 ? recentProducts : [];
  }, [allProducts]);

  // Lấy sản phẩm trending toàn cầu (cho người dùng chưa đăng nhập)
  const getGlobalTrendingProducts = useCallback(async (): Promise<Product[]> => {
    try {
      const globalTrendsResponse = await fetch('/api/analytics/global-trends?days=7&limit=15');
      if (!globalTrendsResponse.ok) {
        return getRecentProducts();
      }

      const globalTrendsData: GlobalTrendsData = (await globalTrendsResponse.json()).data;
      const trendingProducts = globalTrendsData.trendingProducts || [];

      // Map trending products to local products and limit to 6
      const mappedProducts = trendingProducts
        .map(trendingProduct => {
          const localProduct = allProducts.find(p => p.id === trendingProduct.id);
          return localProduct ? { ...localProduct, recommendationScore: trendingProduct.recommendationScore } : null;
        })
        .filter(Boolean)
        .slice(0, 6) as Product[];

      return mappedProducts.length > 0 ? mappedProducts : getRecentProducts();
    } catch (error) {
      return getRecentProducts();
    }
  }, [allProducts, getRecentProducts]);

  // Lấy gợi ý nâng cao cho người dùng đã đăng nhập (sử dụng global trends + personal data)
  const getEnhancedPersonalizedRecommendations = useCallback(async (): Promise<Product[]> => {
    try {
      // 1. Lấy global trends data (tái sử dụng logic có sẵn)
      const globalTrendsResponse = await fetch('/api/analytics/global-trends?days=7&limit=15');
      const globalTrendsData: GlobalTrendsData = globalTrendsResponse.ok
        ? (await globalTrendsResponse.json()).data
        : {
            trendingProducts: [],
            collaborativeFiltering: {},
            categoryTrends: [],
            period: { days: 7, startDate: '', endDate: '' },
            metadata: { totalProducts: 0, avgRating: 0, totalViews: 0 }
          };

      // 2. Lấy lịch sử cá nhân
      const analyticsResponse = await fetch('/api/user/analytics');
      const analyticsData = analyticsResponse.ok ? await analyticsResponse.json() : { viewHistory: [] };
      const viewHistory: ViewHistory[] = analyticsData.viewHistory || [];

      // 3. Lấy lịch sử mua hàng
      const purchaseHistoryResponse = await fetch('/api/user/purchase-history');
      const purchaseHistory = purchaseHistoryResponse.ok ? await purchaseHistoryResponse.json() : [];

      // 4. Kiểm tra nếu là người dùng mới (không có lịch sử xem và mua hàng)
      const isNewUser = viewHistory.length === 0 && (!purchaseHistory || purchaseHistory.length === 0);

      // Nếu là người dùng mới, sử dụng global trending products (tái sử dụng logic có sẵn)
      if (isNewUser) {
        return await getGlobalTrendingProducts();
      }

      // 5. Tạo scoring system cho người dùng có dữ liệu
      const productScores = new Map<string, number>();
      const interestedCategories = new Set<string>();
      const interestedBrands = new Set<string>();

      // 6. Score từ lịch sử xem cá nhân (weight: 3)
      if (viewHistory.length > 0) {
        viewHistory.forEach(item => {
          interestedCategories.add(item.category);
          interestedBrands.add(item.brand);
          const currentScore = productScores.get(item.productId) || 0;
          productScores.set(item.productId, currentScore + 3);
        });
      }

      // 7. Score từ lịch sử mua hàng (weight: 5)
      if (purchaseHistory && purchaseHistory.length > 0) {
        purchaseHistory.forEach((order: any) => {
          if (order.products && order.products.length > 0) {
            order.products.forEach((product: any) => {
              interestedCategories.add(product.category);
              interestedBrands.add(product.brand || 'Apple');
              const currentScore = productScores.get(product.id) || 0;
              productScores.set(product.id, currentScore + 5);
            });
          }
        });
      }

      // 8. Score từ collaborative filtering (weight: 2)
      if (viewHistory.length > 0) {
        viewHistory.forEach(item => {
          const relatedProducts = globalTrendsData.collaborativeFiltering[item.productId] || [];
          relatedProducts.forEach(relatedId => {
            const currentScore = productScores.get(relatedId) || 0;
            productScores.set(relatedId, currentScore + 2);
          });
        });
      }

      // 9. Lọc và score sản phẩm
      const scoredProducts = allProducts
        .filter(product => (product.inStock ?? 0) > 0) // Chỉ sản phẩm còn hàng
        .map(product => {
          let score = 0;

          // Personal interest score
          const personalScore = productScores.get(product.id) || 0;
          score += personalScore;

          // Category/brand interest score
          if (interestedCategories.has(product.categoryId) || interestedBrands.has(product.brand || 'Apple')) {
            score += 1;
          }

          // Global trending score (from global analytics)
          const trendingProduct = globalTrendsData.trendingProducts.find(tp => tp.id === product.id);
          if (trendingProduct) {
            score += trendingProduct.recommendationScore * 0.1; // Scale down global score
          }

          return { ...product, recommendationScore: score };
        })
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, 6); // Limit to 6 products

      return scoredProducts.length > 0 ? scoredProducts : getRecentProducts();
    } catch (error) {
      return getRecentProducts();
    }
  }, [allProducts, getRecentProducts]);

  useEffect(() => {
    const getRecommendations = async () => {
      try {
        if (currentUser) {
          // Người dùng đã đăng nhập - gợi ý nâng cao với global trends
          const recommendations = await getEnhancedPersonalizedRecommendations();
          setRecommendedProducts(recommendations);
        } else {
          // Người dùng chưa đăng nhập - hiển thị trending products từ global analytics
          const trendingProducts = await getGlobalTrendingProducts();
          setRecommendedProducts(trendingProducts);
        }
      } catch (error) {
        // Fallback: hiển thị sản phẩm ngẫu nhiên
        const recentProducts = getRecentProducts();
        setRecommendedProducts(recentProducts);
      } finally {
        setLoading(false);
      }
    };

    getRecommendations();
  }, [currentUser, getEnhancedPersonalizedRecommendations, getGlobalTrendingProducts, getRecentProducts]);

  if (loading) {
    return (
      <Container>
        <div className='xl:px-[50px]'>
          <div className='animate-pulse'>
            <div className='h-8 bg-gray-200 rounded w-64 mb-6'></div>
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 gap-8'>
              {[...Array(6)].map((_, index) => (
                <div key={index} className='bg-gray-200 h-64 rounded'></div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (recommendedProducts.length === 0) {
    return null;
  }

  return (
    <Container>
      <div
        className='mt-12 relative rounded-lg overflow-hidden xl:mx-[50px] bg-gradient-to-r from-pink-100 via-purple-100 to-indigo-300'
        style={{ minHeight: '400px' }}
      >
        {/* Overlay để làm nền tối hơn */}
        <div className='absolute inset-0 bg-gradient-to-r from-pink-200/40 via-purple-200/40 to-indigo-200/40 z-[1]'></div>

        {/* Content */}
        <div className='relative z-10 p-6'>
          {/* Header với icon gradient */}
          <div className='mb-6'>
            <h2 className='flex items-center pb-3 text-2xl font-bold text-[rgb(4,41,122)]'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='40'
                height='40'
                viewBox='0 0 1080 1080'
                fill='none'
                className='mr-3'
              >
                <path
                  d='M515.09 725.824L472.006 824.503C455.444 862.434 402.954 862.434 386.393 824.503L343.308 725.824C304.966 638.006 235.953 568.104 149.868 529.892L31.2779 477.251C-6.42601 460.515 -6.42594 405.665 31.2779 388.929L146.164 337.932C234.463 298.737 304.714 226.244 342.401 135.431L386.044 30.2693C402.239 -8.75637 456.159 -8.75646 472.355 30.2692L515.998 135.432C553.685 226.244 623.935 298.737 712.234 337.932L827.121 388.929C864.825 405.665 864.825 460.515 827.121 477.251L708.53 529.892C622.446 568.104 553.433 638.006 515.09 725.824Z'
                  fill='url(#paint0_radial_2525_777)'
                />
                <path
                  d='M915.485 1036.98L903.367 1064.75C894.499 1085.08 866.349 1085.08 857.481 1064.75L845.364 1036.98C823.765 987.465 784.862 948.042 736.318 926.475L698.987 909.889C678.802 900.921 678.802 871.578 698.987 862.61L734.231 846.951C784.023 824.829 823.623 783.947 844.851 732.75L857.294 702.741C865.966 681.826 894.882 681.826 903.554 702.741L915.997 732.75C937.225 783.947 976.826 824.829 1026.62 846.951L1061.86 862.61C1082.05 871.578 1082.05 900.921 1061.86 909.889L1024.53 926.475C975.987 948.042 937.083 987.465 915.485 1036.98Z'
                  fill='url(#paint1_radial_2525_777)'
                />
                <defs>
                  <radialGradient
                    id='paint0_radial_2525_777'
                    cx='0'
                    cy='0'
                    r='1'
                    gradientUnits='userSpaceOnUse'
                    gradientTransform='translate(670.447 474.006) rotate(78.858) scale(665.5 665.824)'
                  >
                    <stop stopColor='#1BA1E3' />
                    <stop offset='0.0001' stopColor='#1BA1E3' />
                    <stop offset='0.300221' stopColor='#5489D6' />
                    <stop offset='0.545524' stopColor='#9B72CB' />
                    <stop offset='0.825372' stopColor='#D96570' />
                    <stop offset='1' stopColor='#F49C46' />
                  </radialGradient>
                  <radialGradient
                    id='paint1_radial_2525_777'
                    cx='0'
                    cy='0'
                    r='1'
                    gradientUnits='userSpaceOnUse'
                    gradientTransform='translate(670.447 474.006) rotate(78.858) scale(665.5 665.824)'
                  >
                    <stop stopColor='#1BA1E3' />
                    <stop offset='0.0001' stopColor='#1BA1E3' />
                    <stop offset='0.300221' stopColor='#5489D6' />
                    <stop offset='0.545524' stopColor='#9B72CB' />
                    <stop offset='0.825372' stopColor='#D96570' />
                    <stop offset='1' stopColor='#F49C46' />
                  </radialGradient>
                </defs>
              </svg>
              GỢI Ý CHO BẠN
            </h2>
          </div>

          {/* Product Swiper */}
          <div className='product-list-swiper'>
            <Swiper
              modules={[Navigation, Autoplay]}
              spaceBetween={10}
              slidesPerView={6}
              navigation={{
                nextEl: '.swiper-button-next-recommendations',
                prevEl: '.swiper-button-prev-recommendations'
              }}
              autoplay={{
                delay: 3500,
                disableOnInteraction: false
              }}
              loop={recommendedProducts.length > 4}
              breakpoints={{
                320: {
                  slidesPerView: 1,
                  spaceBetween: 10
                },
                640: {
                  slidesPerView: 2,
                  spaceBetween: 10
                },
                768: {
                  slidesPerView: 3,
                  spaceBetween: 10
                },
                1024: {
                  slidesPerView: 4,
                  spaceBetween: 10
                },
                1280: {
                  slidesPerView: 5,
                  spaceBetween: 10
                }
              }}
              className='w-full'
            >
              {recommendedProducts.map(product => (
                <SwiperSlide key={product.id} className='transition-transform duration-300 hover:-translate-y-1'>
                  <ProductCard data={product} className='rounded-lg shadow-sm' />
                </SwiperSlide>
              ))}

              {/* Navigation buttons */}
              <div className='swiper-button-prev-recommendations swiper-button-prev !text-white !w-10 !h-10 !mt-[-20px] after:!text-lg after:!font-bold !bg-white/20 !backdrop-blur-md !rounded-full !transition-all !duration-300 hover:!bg-white/30 hover:!scale-110'></div>
              <div className='swiper-button-next-recommendations swiper-button-next !text-white !w-10 !h-10 !mt-[-20px] after:!text-lg after:!font-bold !bg-white/20 !backdrop-blur-md !rounded-full !transition-all !duration-300 hover:!bg-white/30 hover:!scale-110'></div>
            </Swiper>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default PersonalizedRecommendations;
