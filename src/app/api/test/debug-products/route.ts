import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prismadb';

// Debug endpoint để check products trong database
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugging products in database...');

    // Lấy tất cả products
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        inStock: true,
        price: true,
        promotionStart: true,
        promotionEnd: true,
        promotionalPrice: true,
        createDate: true,
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        inStock: 'desc'
      }
    });

    console.log(`📊 Total products: ${allProducts.length}`);

    // Phân tích stock levels
    const stockAnalysis = {
      total: allProducts.length,
      highStock: allProducts.filter(p => p.inStock > 10).length,
      mediumStock: allProducts.filter(p => p.inStock > 3 && p.inStock <= 10).length,
      lowStock: allProducts.filter(p => p.inStock > 0 && p.inStock <= 3).length,
      outOfStock: allProducts.filter(p => p.inStock === 0).length
    };

    // Lấy products có stock > 3
    const candidateProducts = allProducts.filter(p => p.inStock > 3);

    // Check promotions
    const now = new Date();
    const productsWithActivePromotions = allProducts.filter(p => 
      p.promotionStart && 
      p.promotionEnd && 
      p.promotionStart <= now && 
      p.promotionEnd >= now
    );

    // Products eligible for promotion suggestions
    const eligibleProducts = candidateProducts.filter(p => {
      const hasActivePromotion = p.promotionStart && 
                                p.promotionEnd && 
                                p.promotionStart <= now && 
                                p.promotionEnd >= now;
      return !hasActivePromotion;
    });

    return NextResponse.json({
      success: true,
      data: {
        stockAnalysis,
        candidateProducts: candidateProducts.map(p => ({
          id: p.id,
          name: p.name,
          stock: p.inStock,
          category: p.category?.name,
          hasPromotion: !!(p.promotionStart && p.promotionEnd && 
                          p.promotionStart <= now && p.promotionEnd >= now)
        })),
        eligibleProducts: eligibleProducts.map(p => ({
          id: p.id,
          name: p.name,
          stock: p.inStock,
          category: p.category?.name,
          daysOld: p.createDate ? 
            Math.floor((Date.now() - p.createDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
        })),
        activePromotions: productsWithActivePromotions.length,
        summary: {
          totalProducts: allProducts.length,
          candidatesForPromotion: candidateProducts.length,
          eligibleForSuggestions: eligibleProducts.length,
          activePromotions: productsWithActivePromotions.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Error debugging products:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
