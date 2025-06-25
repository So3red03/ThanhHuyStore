import prisma from '../prismadb';

export interface PromotionSuggestion {
  id: string;
  type: 'PRODUCT_VOUCHER' | 'CATEGORY_PROMOTION' | 'STOCK_CLEARANCE';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  suggestedAction: string;
  data: {
    productId?: string;
    productName?: string;
    categoryId?: string;
    categoryName?: string;
    currentStock?: number;
    daysWithoutSale?: number;
    viewCount?: number;
    avgCategoryPrice?: number;
    suggestedDiscount?: number;
    reasoning: string[];
  };
}

export class PromotionSuggestionEngine {
  private static instance: PromotionSuggestionEngine;

  public static getInstance(): PromotionSuggestionEngine {
    if (!PromotionSuggestionEngine.instance) {
      PromotionSuggestionEngine.instance = new PromotionSuggestionEngine();
    }
    return PromotionSuggestionEngine.instance;
  }

  // Phân tích và tạo gợi ý khuyến mãi
  public async generateSuggestions(): Promise<PromotionSuggestion[]> {
    const suggestions: PromotionSuggestion[] = [];

    try {
      console.log('🚀 Starting promotion analysis...');

      // 1. Phân tích sản phẩm tồn kho cao
      console.log('📦 Analyzing high stock products...');
      const highStockSuggestions = await this.analyzeHighStockProducts();
      console.log(`Found ${highStockSuggestions.length} high stock suggestions`);
      suggestions.push(...highStockSuggestions);

      // 2. Phân tích sản phẩm ít bán
      console.log('📉 Analyzing low sales products...');
      const lowSalesSuggestions = await this.analyzeLowSalesProducts();
      console.log(`Found ${lowSalesSuggestions.length} low sales suggestions`);
      suggestions.push(...lowSalesSuggestions);

      // 3. Phân tích danh mục có hiệu suất thấp
      console.log('🏷️ Analyzing low performing categories...');
      const categorySuggestions = await this.analyzeLowPerformingCategories();
      console.log(`Found ${categorySuggestions.length} category suggestions`);
      suggestions.push(...categorySuggestions);

      // 4. Sắp xếp theo độ ưu tiên
      const sortedSuggestions = this.prioritizeSuggestions(suggestions);

      console.log(`✅ Generated ${sortedSuggestions.length} total suggestions`);
      return sortedSuggestions;
    } catch (error) {
      console.error('❌ Error generating promotion suggestions:', error);
      return [];
    }
  }

  // Phân tích sản phẩm tồn kho cao
  private async analyzeHighStockProducts(): Promise<PromotionSuggestion[]> {
    const suggestions: PromotionSuggestion[] = [];

    try {
      // Lấy sản phẩm có tồn kho > 50
      const highStockProducts = await prisma.product.findMany({
        where: {
          inStock: {
            gt: 50
          }
        },
        include: {
          category: true
        },
        orderBy: {
          inStock: 'desc'
        },
        take: 10
      });

      for (const product of highStockProducts) {
        // Mock data cho số ngày không bán (vì orderItem table chưa có)
        const daysWithoutSale = Math.floor(Math.random() * 90) + 10; // Random 10-100 ngày

        // Tính discount đề xuất dựa trên tồn kho và thời gian
        let suggestedDiscount = 10; // Base discount
        if (product.inStock > 100) suggestedDiscount += 5;
        if (daysWithoutSale > 30) suggestedDiscount += 10;
        if (daysWithoutSale > 60) suggestedDiscount += 5;

        const priority = this.calculatePriority(product.inStock, daysWithoutSale);

        suggestions.push({
          id: `high-stock-${product.id}`,
          type: 'STOCK_CLEARANCE',
          priority,
          title: `Giải phóng tồn kho: ${product.name}`,
          description: `Sản phẩm có tồn kho cao (${product.inStock} sản phẩm) và ${daysWithoutSale} ngày không bán`,
          suggestedAction: `Tạo voucher giảm ${suggestedDiscount}% cho sản phẩm này`,
          data: {
            productId: product.id,
            productName: product.name,
            categoryId: product.categoryId,
            categoryName: 'Category Name', // Mock data
            currentStock: product.inStock,
            daysWithoutSale,
            suggestedDiscount,
            reasoning: [
              `Tồn kho cao: ${product.inStock} sản phẩm`,
              `${daysWithoutSale} ngày không có đơn hàng`,
              `Cần giải phóng tồn kho để tránh ứ đọng vốn`,
              `Giảm giá có thể kích thích nhu cầu mua`
            ]
          }
        });
      }
    } catch (error) {
      console.error('Error analyzing high stock products:', error);
    }

    return suggestions;
  }

  // Phân tích sản phẩm ít bán
  private async analyzeLowSalesProducts(): Promise<PromotionSuggestion[]> {
    const suggestions: PromotionSuggestion[] = [];

    try {
      // Lấy sản phẩm có ít đơn hàng trong 30 ngày qua
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const products = await prisma.product.findMany({
        include: {
          category: true
        },
        take: 8
      });

      // Mock data cho low sales products
      const lowSalesProducts = products.filter(product => product.inStock > 10);

      for (const product of lowSalesProducts.slice(0, 8)) {
        const salesCount = Math.floor(Math.random() * 5); // Mock sales count 0-4
        const suggestedDiscount = salesCount === 0 ? 20 : 15;

        suggestions.push({
          id: `low-sales-${product.id}`,
          type: 'PRODUCT_VOUCHER',
          priority: salesCount === 0 ? 'HIGH' : 'MEDIUM',
          title: `Kích thích bán hàng: ${product.name}`,
          description: `Sản phẩm chỉ có ${salesCount} đơn hàng trong 30 ngày qua`,
          suggestedAction: `Tạo voucher giảm ${suggestedDiscount}% để kích thích mua hàng`,
          data: {
            productId: product.id,
            productName: product.name,
            categoryId: product.categoryId,
            categoryName: 'Category Name', // Mock data
            currentStock: product.inStock,
            suggestedDiscount,
            reasoning: [
              `Chỉ có ${salesCount} đơn hàng trong 30 ngày`,
              `Tồn kho còn ${product.inStock} sản phẩm`,
              `Cần kích thích nhu cầu mua hàng`,
              `Giảm giá có thể tăng visibility của sản phẩm`
            ]
          }
        });
      }
    } catch (error) {
      console.error('Error analyzing low sales products:', error);
    }

    return suggestions;
  }

  // Phân tích danh mục có hiệu suất thấp
  private async analyzeLowPerformingCategories(): Promise<PromotionSuggestion[]> {
    const suggestions: PromotionSuggestion[] = [];

    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Mock data cho category analysis
      const categories = await prisma.category.findMany({
        take: 5
      });

      for (const category of categories) {
        // Mock sales data
        const totalSales = Math.floor(Math.random() * 20) + 5; // 5-25 sales
        const totalProducts = Math.floor(Math.random() * 10) + 5; // 5-15 products
        const avgSalesPerProduct = totalProducts > 0 ? totalSales / totalProducts : 0;

        // Nếu trung bình < 2 đơn hàng/sản phẩm trong 30 ngày
        if (avgSalesPerProduct < 2 && totalProducts > 3) {
          suggestions.push({
            id: `low-category-${category.id}`,
            type: 'CATEGORY_PROMOTION',
            priority: avgSalesPerProduct < 1 ? 'HIGH' : 'MEDIUM',
            title: `Khuyến mãi danh mục: ${category.name}`,
            description: `Danh mục có hiệu suất thấp với trung bình ${avgSalesPerProduct.toFixed(1)} đơn hàng/sản phẩm`,
            suggestedAction: `Tạo promotion giảm 15-20% cho toàn bộ danh mục`,
            data: {
              categoryId: category.id,
              categoryName: category.name,
              suggestedDiscount: 18,
              reasoning: [
                `Trung bình chỉ ${avgSalesPerProduct.toFixed(1)} đơn hàng/sản phẩm`,
                `Tổng ${totalSales} đơn hàng cho ${totalProducts} sản phẩm`,
                `Cần kích thích toàn bộ danh mục`,
                `Promotion danh mục có thể tăng traffic tổng thể`
              ]
            }
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing categories:', error);
    }

    return suggestions;
  }

  // Tính độ ưu tiên
  private calculatePriority(stock: number, daysWithoutSale: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (stock > 100 && daysWithoutSale > 60) return 'HIGH';
    if (stock > 50 && daysWithoutSale > 30) return 'HIGH';
    if (stock > 30 && daysWithoutSale > 45) return 'MEDIUM';
    return 'LOW';
  }

  // Sắp xếp theo độ ưu tiên
  private prioritizeSuggestions(suggestions: PromotionSuggestion[]): PromotionSuggestion[] {
    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };

    return suggestions.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Nếu cùng priority, ưu tiên theo stock cao hơn
      const stockA = a.data.currentStock || 0;
      const stockB = b.data.currentStock || 0;
      return stockB - stockA;
    });
  }

  // Test function để kiểm tra engine
  public async testEngine(): Promise<void> {
    console.log('🧪 Testing Promotion Suggestion Engine...');
    const suggestions = await this.generateSuggestions();
    console.log(`Generated ${suggestions.length} suggestions for testing`);

    suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. [${suggestion.priority}] ${suggestion.title}`);
    });
  }
}
