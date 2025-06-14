'use client';

import { useEffect, useState } from 'react';
import { Product } from '@prisma/client';
import Container from './Container';
import ProductCard from './products/ProductCard';
import { getCurrentUser } from '../actions/getCurrentUser';

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

const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({ 
  allProducts, 
  currentUser 
}) => {
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
      const viewHistory: ViewHistory[] = JSON.parse(
        localStorage.getItem('productViewHistory') || '[]'
      );

      // Lấy lịch sử mua hàng từ API
      const purchaseHistoryResponse = await fetch('/api/user/purchase-history');
      const purchaseHistory = purchaseHistoryResponse.ok 
        ? await purchaseHistoryResponse.json() 
        : [];

      // Tạo danh sách danh mục và brand đã quan tâm
      const interestedCategories = new Set<string>();
      const interestedBrands = new Set<string>();

      // Từ lịch sử xem (30 ngày gần nhất)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
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
          interestedBrands.add(product.brand);
        });
      });

      // Lọc sản phẩm gợi ý
      const recommendations = allProducts
        .filter(product => {
          // Kiểm tra category (từ product.category hoặc product.category.name)
          const productCategory = typeof product.category === 'string'
            ? product.category
            : product.category?.name || '';

          return interestedCategories.has(productCategory) ||
                 interestedBrands.has(product.brand || 'Apple');
        })
        .filter(product => product.inStock > 0) // Chỉ sản phẩm còn hàng
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
    return allProducts
      .filter(product => product.inStock > 0 && product.inStock <= 10) // Tồn kho <= 10
      .sort((a, b) => a.inStock - b.inStock) // Sắp xếp theo tồn kho tăng dần
      .slice(0, 8);
  };

  // Lấy sản phẩm ngẫu nhiên (fallback)
  const getRandomProducts = (): Product[] => {
    const availableProducts = allProducts.filter(product => product.inStock > 0);
    const shuffled = [...availableProducts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 8);
  };

  // Lưu lịch sử xem sản phẩm
  const saveProductView = (product: Product) => {
    try {
      const viewHistory: ViewHistory[] = JSON.parse(
        localStorage.getItem('productViewHistory') || '[]'
      );

      const newView: ViewHistory = {
        productId: product.id,
        category: typeof product.category === 'string'
          ? product.category
          : product.category?.name || '',
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
        <div className="xl:px-[50px]">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-gray-200 h-64 rounded"></div>
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

  const sectionTitle = currentUser 
    ? "🎯 Gợi ý dành cho bạn" 
    : "🔥 Sản phẩm số lượng có hạn";

  return (
    <Container>
      <div className="xl:px-[50px]">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            {sectionTitle}
          </h2>
          <p className="text-gray-600">
            {currentUser 
              ? "Dựa trên sở thích và lịch sử mua hàng của bạn"
              : "Nhanh tay sở hữu trước khi hết hàng"
            }
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
          {recommendedProducts.map((product) => (
            <div key={product.id} onClick={() => saveProductView(product)}>
              <ProductCard data={product} />
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
};

export default PersonalizedRecommendations;
