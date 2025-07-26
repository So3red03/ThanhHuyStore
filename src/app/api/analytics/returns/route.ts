import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import prisma from '@/app/libs/prismadb';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeFilter = searchParams.get('timeFilter');
    const daysParam = searchParams.get('days');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Calculate date range
    let endDate = new Date();
    let startDate = new Date();

    if (startDateParam && endDateParam) {
      // Custom date range
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      // Ensure endDate is end of day
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Use days parameter (preferred) or fallback to timeFilter
      const days = daysParam ? parseInt(daysParam) : timeFilter ? parseInt(timeFilter) : 30;
      if (isNaN(days)) {
        // Fallback to 30 days if invalid
        startDate.setDate(endDate.getDate() - 30);
      } else {
        startDate.setDate(endDate.getDate() - days);
      }
    }

    // Fetch return requests data
    const returnRequests = await prisma.returnRequest.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        order: true,
        user: true
      }
    });

    // Calculate overview metrics
    const totalReturns = returnRequests.filter(r => r.type === 'RETURN').length;
    const totalExchanges = returnRequests.filter(r => r.type === 'EXCHANGE').length;
    const totalRefunded = returnRequests
      .filter(r => r.refundAmount && r.status === 'COMPLETED')
      .reduce((sum, r) => sum + (r.refundAmount || 0), 0);

    // Get total orders for rate calculation
    const totalOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'completed'
      }
    });

    const returnRate = totalOrders > 0 ? (totalReturns / totalOrders) * 100 : 0;
    const exchangeRate = totalOrders > 0 ? (totalExchanges / totalOrders) * 100 : 0;

    // Analyze reasons
    const reasonCounts = returnRequests.reduce((acc, request) => {
      const reason = request.reason || 'UNKNOWN';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const reasonAnalysis = Object.entries(reasonCounts)
      .map(([reason, count]) => {
        const percentage = returnRequests.length > 0 ? (count / returnRequests.length) * 100 : 0;
        const refunded = returnRequests
          .filter(r => r.reason === reason && r.refundAmount && r.status === 'COMPLETED')
          .reduce((sum, r) => sum + (r.refundAmount || 0), 0);

        // Determine business impact based on reason and frequency
        let businessImpact: 'high' | 'medium' | 'low' = 'low';
        if (reason === 'DEFECTIVE' || reason === 'WRONG_ITEM') {
          businessImpact = 'high';
        } else if (percentage > 20) {
          businessImpact = 'medium';
        }

        // Simple trend calculation (would need historical data for real trend)
        const trend = percentage > 15 ? 'up' : percentage < 5 ? 'down' : 'stable';

        return {
          reason,
          count,
          percentage,
          totalRefunded: refunded,
          averageProcessingTime: 2.5, // Mock data - would calculate from actual data
          trend: trend as 'up' | 'down' | 'stable',
          businessImpact
        };
      })
      .sort((a, b) => b.count - a.count);

    // Generate business insights
    const businessInsights = [];

    // High return rate warning
    if (returnRate > 10) {
      businessInsights.push({
        type: 'warning' as const,
        title: 'Tỷ lệ trả hàng cao',
        description: `Tỷ lệ trả hàng ${returnRate.toFixed(1)}% vượt ngưỡng an toàn (10%). Cần điều tra nguyên nhân.`,
        actionRequired: true,
        impact: 'high' as const
      });
    }

    // Defective products alert
    const defectiveCount = reasonCounts['DEFECTIVE'] || 0;
    if (defectiveCount > totalReturns * 0.3) {
      businessInsights.push({
        type: 'error' as const,
        title: 'Vấn đề chất lượng sản phẩm',
        description: `${defectiveCount} trường hợp trả hàng do lỗi sản phẩm. Cần kiểm tra quy trình QC.`,
        actionRequired: true,
        impact: 'high' as const
      });
    }

    // Positive insight
    if (totalExchanges > totalReturns) {
      businessInsights.push({
        type: 'success' as const,
        title: 'Xu hướng đổi hàng tích cực',
        description: 'Khách hàng ưu tiên đổi hàng hơn trả hàng, giúp giữ chân khách hàng.',
        actionRequired: false,
        impact: 'medium' as const
      });
    }

    const analyticsData = {
      overview: {
        totalReturns,
        totalExchanges,
        returnRate,
        exchangeRate,
        totalRefunded,
        averageRefundAmount: totalReturns > 0 ? totalRefunded / totalReturns : 0,
        totalProcessingTime: 2.5, // Mock data - would calculate from actual data
        customerSatisfactionRate: 85 // Mock data - would calculate from surveys
      },
      reasonAnalysis,
      productAnalysis: [], // Would implement with product data analysis
      timeAnalysis: [], // Would implement with historical data
      businessInsights
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error fetching return analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
