import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { ProductAnalyticsService } from '@/app/libs/ai/productAnalyticsService';

/**
 * API endpoint để chạy AI analysis cho sản phẩm
 * POST /api/ai/analyze-products
 * 
 * Chức năng:
 * - Phân tích hiệu suất sản phẩm dựa trên AnalyticsEvent và Order data
 * - Tạo AI recommendations thông minh
 * - Gửi notifications cho admin/staff
 * 
 * Chỉ admin/staff mới có thể gọi API này
 */
export async function POST(request: Request) {
  try {
    // Kiểm tra quyền truy cập
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      return NextResponse.json(
        { error: 'Unauthorized. Only admin/staff can run AI analysis.' },
        { status: 401 }
      );
    }

    console.log(`🤖 AI Analysis started by ${currentUser.name} (${currentUser.role})`);

    // Chạy AI analysis
    const result = await ProductAnalyticsService.runAIAnalysis();

    // Log kết quả
    console.log('✅ AI Analysis completed:', result);

    return NextResponse.json({
      success: true,
      message: 'AI analysis completed successfully',
      data: {
        productsAnalyzed: result.analyzed,
        recommendationsGenerated: result.recommendations,
        notificationsSent: result.notifications,
        timestamp: new Date().toISOString(),
        runBy: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role
        }
      }
    });

  } catch (error) {
    console.error('❌ AI Analysis API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'AI analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint để lấy thông tin về AI analysis
 * GET /api/ai/analyze-products
 */
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'STAFF')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Lấy performance data để hiển thị
    const performanceData = await ProductAnalyticsService.analyzeProductPerformance(30);
    const recommendations = await ProductAnalyticsService.generateAIRecommendations(performanceData);

    // Tính toán một số thống kê
    const stats = {
      totalProducts: performanceData.length,
      lowPerformingProducts: performanceData.filter(p => {
        const daysInStock = Math.floor((new Date().getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        return daysInStock > 30 && p.salesCount30d < 5;
      }).length,
      trendingProducts: performanceData.filter(p => p.viewCount7d > (p.viewCount30d * 0.4)).length,
      highStockProducts: performanceData.filter(p => p.inStock > 50).length,
      totalRecommendations: recommendations.length,
      urgentRecommendations: recommendations.filter(r => r.urgency === 'HIGH' || r.urgency === 'CRITICAL').length
    };

    return NextResponse.json({
      success: true,
      data: {
        stats,
        topRecommendations: recommendations.slice(0, 10), // Top 10 recommendations
        lastAnalyzed: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ AI Analysis GET Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get AI analysis data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
