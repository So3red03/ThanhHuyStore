'use client';

import { useEffect, useState } from 'react';
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

const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({ allProducts, currentUser }) => {
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRecommendations = async () => {
      try {
        if (currentUser) {
          // Người dùng đã đăng nhập - gợi ý dựa trên lịch sử mua hàng và xem
          const recommendations = await getPersonalizedRecommendations();
          setRecommendedProducts(recommendations);
        } else {
          // Người dùng chưa đăng nhập - hiển thị sản phẩm tồn kho thấp
          const lowStockProducts = getLowStockProducts();
          setRecommendedProducts(lowStockProducts);
        }
      } catch (error) {
        console.error('Error getting recommendations:', error);
        // Fallback: hiển thị sản phẩm ngẫu nhiên
        const randomProducts = getRandomProducts();
        setRecommendedProducts(randomProducts);
      } finally {
        setLoading(false);
      }
    };

    getRecommendations();
  }, [currentUser, allProducts]);

  // Lấy gợi ý cá nhân hóa cho người dùng đã đăng nhập
  const getPersonalizedRecommendations = async (): Promise<Product[]> => {
    try {
      // Lấy lịch sử xem từ localStorage
      const viewHistory: ViewHistory[] = JSON.parse(localStorage.getItem('productViewHistory') || '[]');

      // Lấy lịch sử mua hàng từ API
      const purchaseHistoryResponse = await fetch('/api/user/purchase-history');
      const purchaseHistory = purchaseHistoryResponse.ok ? await purchaseHistoryResponse.json() : [];

      // Tạo danh sách danh mục và brand đã quan tâm
      const interestedCategories = new Set<string>();
      const interestedBrands = new Set<string>();

      // Từ lịch sử xem (30 ngày gần nhất)
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      viewHistory
        .filter(item => item.viewedAt > thirtyDaysAgo)
        .forEach(item => {
          interestedCategories.add(item.category);
          interestedBrands.add(item.brand);
        });

      // Từ lịch sử mua hàng
      purchaseHistory.forEach((order: any) => {
        order.products.forEach((product: any) => {
          interestedCategories.add(product.category);
          interestedBrands.add(product.brand || 'Apple'); // Handle null brand
        });
      });

      // Lọc sản phẩm gợi ý
      const recommendations = allProducts
        .filter(product => {
          // Lấy categoryId từ product
          const productCategoryId = product.categoryId;

          // Kiểm tra nếu categoryId có trong danh sách categories quan tâm
          return interestedCategories.has(productCategoryId) || interestedBrands.has(product.brand || 'Apple');
        })
        .filter(product => (product.inStock ?? 0) > 0) // Chỉ sản phẩm còn hàng
        .sort((a, b) => {
          // Ưu tiên sản phẩm mới
          const dateA = new Date(a.createDate || a.createdAt);
          const dateB = new Date(b.createDate || b.createdAt);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 8);

      return recommendations.length > 0 ? recommendations : getRandomProducts();
    } catch (error) {
      console.error('Error in getPersonalizedRecommendations:', error);
      return getRandomProducts();
    }
  };

  // Lấy sản phẩm tồn kho thấp (cho người dùng chưa đăng nhập)
  const getLowStockProducts = (): Product[] => {
    const lowStockProducts = allProducts
      .filter(product => (product.inStock ?? 0) > 0 && (product.inStock ?? 0) <= 10) // Tồn kho <= 10
      .sort((a, b) => (a.inStock ?? 0) - (b.inStock ?? 0)) // Sắp xếp theo tồn kho tăng dần
      .slice(0, 8);

    // Nếu không có sản phẩm tồn kho thấp, lấy sản phẩm ngẫu nhiên
    return lowStockProducts.length > 0 ? lowStockProducts : getRandomProducts();
  };

  // Lấy sản phẩm ngẫu nhiên (fallback)
  const getRandomProducts = (): Product[] => {
    const availableProducts = allProducts.filter(product => (product.inStock ?? 0) > 0);
    const shuffled = [...availableProducts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 8);
  };

  // Lưu lịch sử xem sản phẩm
  const saveProductView = (product: Product) => {
    try {
      const viewHistory: ViewHistory[] = JSON.parse(localStorage.getItem('productViewHistory') || '[]');

      const newView: ViewHistory = {
        productId: product.id,
        category: product.categoryId,
        brand: product.brand || 'Apple',
        viewedAt: Date.now()
      };

      // Loại bỏ view cũ của cùng sản phẩm
      const filteredHistory = viewHistory.filter(item => item.productId !== product.id);

      // Thêm view mới và giữ tối đa 50 records
      const updatedHistory = [newView, ...filteredHistory].slice(0, 50);

      localStorage.setItem('productViewHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving product view:', error);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className='xl:px-[50px]'>
          <div className='animate-pulse'>
            <div className='h-8 bg-gray-200 rounded w-64 mb-6'></div>
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-8'>
              {[...Array(8)].map((_, index) => (
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
              slidesPerView={5}
              navigation={{
                nextEl: '.swiper-button-next-recommendations',
                prevEl: '.swiper-button-prev-recommendations'
              }}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false
              }}
              loop={recommendedProducts.length > 5}
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
                  <div onClick={() => saveProductView(product)}>
                    <ProductCard data={product} className='rounded-lg shadow-sm' />
                  </div>
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
