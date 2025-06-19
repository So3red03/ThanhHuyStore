import prisma from '../libs/prismadb';

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

      // 3. Phân tích danh mục ế ẩm
      console.log('🏷️ Analyzing category performance...');
      const categoryPromotions = await this.analyzeCategoryPerformance();
      console.log(`Found ${categoryPromotions.length} category suggestions`);
      suggestions.push(...categoryPromotions);

      // 4. Phân tích sản phẩm có lượt xem cao nhưng không bán
      console.log('👀 Analyzing high view low sales...');
      const highViewLowSales = await this.analyzeHighViewLowSales();
      console.log(`Found ${highViewLowSales.length} high view suggestions`);
      suggestions.push(...highViewLowSales);

      console.log(`✅ Total suggestions generated: ${suggestions.length}`);

      // Sắp xếp theo độ ưu tiên
      return suggestions.sort((a, b) => {
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    } catch (error) {
      console.error('Error generating promotion suggestions:', error);
      return [];
    }
  }

  // Phân tích sản phẩm tồn kho cao
  private async analyzeHighStockProducts(): Promise<PromotionSuggestion[]> {
    const suggestions: PromotionSuggestion[] = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Lấy sản phẩm có tồn kho > 3 (giảm threshold để test) và không có khuyến mãi hiện tại
    const highStockProducts = await prisma.product.findMany({
      where: {
        inStock: { gt: 3 }, // Giảm từ 50 xuống 3 để test
        OR: [{ promotionStart: null }, { promotionEnd: { lt: new Date() } }, { promotionalPrice: null }]
      },
      include: {
        category: true
      }
    });

    console.log(
      `📦 Found ${highStockProducts.length} products with stock > 3:`,
      highStockProducts.map(p => ({ name: p.name, stock: p.inStock }))
    );

    for (const product of highStockProducts) {
      // Kiểm tra đơn hàng trong 30 ngày
      const recentOrders = await prisma.order.count({
        where: {
          createDate: { gte: thirtyDaysAgo },
          products: {
            some: {
              id: product.id
            }
          }
        }
      });

      console.log(`📊 Product ${product.name}: ${recentOrders} orders in last 30 days`);

      // Thay đổi logic: nếu ít hơn 2 đơn hàng thì suggest (thay vì 0)
      if (recentOrders <= 1) {
        const daysWithoutSale = Math.floor(
          (Date.now() - (product.createDate?.getTime() || Date.now())) / (1000 * 60 * 60 * 24)
        );

        const reasoning = [
          `Tồn kho cao: ${product.inStock} sản phẩm`,
          `Không có đơn hàng trong 30 ngày`,
          `Đã tồn kho ${daysWithoutSale} ngày`,
          'Không có chương trình khuyến mãi hiện tại'
        ];

        suggestions.push({
          id: `high-stock-${product.id}`,
          type: 'STOCK_CLEARANCE',
          priority: product.inStock > 10 ? 'HIGH' : 'MEDIUM', // Giảm threshold
          title: `Sản phẩm ${product.name} tồn kho cao`,
          description: `Sản phẩm đã tồn kho ${daysWithoutSale} ngày, chưa có đơn hàng`,
          suggestedAction: `Tạo voucher giảm giá ${this.calculateSuggestedDiscount(product.inStock)}%`,
          data: {
            productId: product.id,
            productName: product.name,
            currentStock: product.inStock,
            daysWithoutSale,
            suggestedDiscount: this.calculateSuggestedDiscount(product.inStock),
            reasoning
          }
        });

        console.log(`✅ Added suggestion for ${product.name} (stock: ${product.inStock})`);
      }
    }

    return suggestions;
  }

  // Phân tích sản phẩm ít bán
  private async analyzeLowSalesProducts(): Promise<PromotionSuggestion[]> {
    const suggestions: PromotionSuggestion[] = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Lấy tất cả sản phẩm và đếm đơn hàng
    const products = await prisma.product.findMany({
      where: {
        inStock: { gt: 0 },
        OR: [{ promotionStart: null }, { promotionEnd: { lt: new Date() } }]
      },
      include: {
        category: true
      }
    });

    for (const product of products) {
      const orderCount = await prisma.order.count({
        where: {
          createDate: { gte: thirtyDaysAgo },
          products: {
            some: {
              id: product.id
            }
          }
        }
      });

      // Tính giá trung bình danh mục
      const avgCategoryPrice = await prisma.product.aggregate({
        where: { categoryId: product.categoryId },
        _avg: { price: true }
      });

      const avgPrice = avgCategoryPrice._avg.price || 0;
      const isPriceHigh = product.price > avgPrice * 1.2; // Cao hơn 20% so với TB

      if (orderCount <= 2 && isPriceHigh) {
        const reasoning = [
          `Ít đơn hàng: ${orderCount} đơn trong 30 ngày`,
          `Giá cao: ${product.price.toLocaleString('vi-VN')} VND`,
          `Giá TB danh mục: ${avgPrice.toLocaleString('vi-VN')} VND`,
          'Có thể do giá không cạnh tranh'
        ];

        suggestions.push({
          id: `low-sales-${product.id}`,
          type: 'PRODUCT_VOUCHER',
          priority: 'MEDIUM',
          title: `Sản phẩm ${product.name} bán chậm`,
          description: `Chỉ có ${orderCount} đơn hàng và giá cao hơn trung bình`,
          suggestedAction: 'Tạo voucher thử nghiệm 15%',
          data: {
            productId: product.id,
            productName: product.name,
            currentStock: product.inStock,
            avgCategoryPrice: avgPrice,
            suggestedDiscount: 15,
            reasoning
          }
        });
      }
    }

    return suggestions;
  }

  // Phân tích danh mục ế ẩm
  private async analyzeCategoryPerformance(): Promise<PromotionSuggestion[]> {
    const suggestions: PromotionSuggestion[] = [];

    const categories = await prisma.category.findMany({
      include: {
        products: true
      }
    });

    for (const category of categories) {
      const highStockCount = category.products.filter(p => p.inStock > 20).length;

      if (highStockCount >= 5) {
        // Nhiều sản phẩm tồn kho cao
        const reasoning = [
          `${highStockCount} sản phẩm có tồn kho > 20`,
          `Tổng ${category.products.length} sản phẩm trong danh mục`,
          'Cần chiến lược marketing toàn danh mục'
        ];

        suggestions.push({
          id: `category-${category.id}`,
          type: 'CATEGORY_PROMOTION',
          priority: highStockCount > 10 ? 'HIGH' : 'MEDIUM',
          title: `Danh mục ${category.name} có nhiều sản phẩm ế ẩm`,
          description: `${highStockCount} sản phẩm có tồn kho cao`,
          suggestedAction: 'Tạo khuyến mãi toàn danh mục 5-10%',
          data: {
            categoryId: category.id,
            categoryName: category.name,
            currentStock: category.products.reduce((sum, p) => sum + p.inStock, 0),
            suggestedDiscount: 7,
            reasoning
          }
        });
      }
    }

    return suggestions;
  }

  // Phân tích sản phẩm có lượt xem cao nhưng không bán
  private async analyzeHighViewLowSales(): Promise<PromotionSuggestion[]> {
    const suggestions: PromotionSuggestion[] = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Lấy analytics data cho sản phẩm
    const productViews = await prisma.analyticsEvent.groupBy({
      by: ['entityId'],
      where: {
        eventType: 'PRODUCT_VIEW',
        entityType: 'product',
        timestamp: { gte: thirtyDaysAgo },
        entityId: { not: null }
      },
      _count: { entityId: true }
    });

    for (const view of productViews) {
      if (view._count.entityId > 50) {
        // Nhiều lượt xem
        const product = await prisma.product.findUnique({
          where: { id: view.entityId! },
          include: { category: true }
        });

        if (product) {
          const orderCount = await prisma.order.count({
            where: {
              createDate: { gte: thirtyDaysAgo },
              products: {
                some: { id: product.id }
              }
            }
          });

          if (orderCount <= 3) {
            // Ít đơn hàng
            const reasoning = [
              `Lượt xem cao: ${view._count.entityId} lượt`,
              `Đơn hàng thấp: ${orderCount} đơn`,
              'Tỷ lệ chuyển đổi thấp',
              'Có thể cần điều chỉnh giá hoặc khuyến mãi'
            ];

            suggestions.push({
              id: `high-view-${product.id}`,
              type: 'PRODUCT_VOUCHER',
              priority: 'MEDIUM',
              title: `Sản phẩm ${product.name} được xem nhiều nhưng chưa bán`,
              description: `${view._count.entityId} lượt xem nhưng chỉ ${orderCount} đơn hàng`,
              suggestedAction: 'Tạo voucher thử nghiệm 10%',
              data: {
                productId: product.id,
                productName: product.name,
                viewCount: view._count.entityId,
                currentStock: product.inStock,
                suggestedDiscount: 10,
                reasoning
              }
            });
          }
        }
      }
    }

    return suggestions;
  }

  // Tính toán mức giảm giá đề xuất dựa trên tồn kho
  private calculateSuggestedDiscount(stock: number): number {
    if (stock > 20) return 20;
    if (stock > 15) return 15;
    if (stock > 10) return 10;
    if (stock > 5) return 8;
    return 5;
  }
}
