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
    let useTimeFilter = true;

    if (startDateParam && endDateParam) {
      // Custom date range
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      // Ensure endDate is end of day
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Use days parameter (preferred) or fallback to timeFilter
      const days = daysParam ? parseInt(daysParam) : timeFilter ? parseInt(timeFilter) : 30;
      if (isNaN(days) || days <= 0) {
        // If days is 0 or invalid, get all data
        useTimeFilter = false;
      } else {
        startDate.setDate(endDate.getDate() - days);
      }
    }

    // Fetch return requests data
    const returnRequests = await prisma.returnRequest.findMany({
      where: useTimeFilter
        ? {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        : {}, // No time filter - get all data
      include: {
        order: true,
        user: true
      }
    });

    console.log('Found return requests:', returnRequests.length);
    if (returnRequests.length > 0) {
      console.log('Sample return request structure:', {
        id: returnRequests[0].id,
        type: returnRequests[0].type,
        reason: returnRequests[0].reason,
        hasOrder: !!returnRequests[0].order,
        orderProducts: returnRequests[0].order?.products ? 'Has products' : 'No products',
        orderProductsType: typeof returnRequests[0].order?.products,
        hasItems: !!returnRequests[0].items,
        itemsType: typeof returnRequests[0].items
      });
    }

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

    // Analyze products with return issues
    const productReturnCounts = returnRequests.reduce((acc, request) => {
      let products: any[] = [];

      // Try to get products from multiple sources
      if (request.order?.products) {
        // Parse products from order if it's a string
        try {
          products =
            typeof request.order.products === 'string' ? JSON.parse(request.order.products) : request.order.products;
        } catch (e) {
          console.log('Error parsing order products:', e);
        }
      }

      // Also try to get products from items field (newer structure)
      if (request.items && (!products || products.length === 0)) {
        try {
          const items = typeof request.items === 'string' ? JSON.parse(request.items) : request.items;
          if (Array.isArray(items)) {
            products = items;
          }
        } catch (e) {
          console.log('Error parsing items:', e);
        }
      }

      if (Array.isArray(products) && products.length > 0) {
        products.forEach((product: any) => {
          // Use multiple possible product identifiers
          const productId = product.id || product.productId || product.selectedProductId || 'unknown';
          const productName = product.name || product.productName || product.selectedProductName || 'Unknown Product';
          const productKey = `${productId}_${productName}`;

          if (!acc[productKey]) {
            acc[productKey] = {
              productId: productId,
              productName: productName,
              returnCount: 0,
              exchangeCount: 0,
              totalRefunded: 0,
              reasons: []
            };
          }

          if (request.type === 'RETURN') {
            acc[productKey].returnCount++;
          } else if (request.type === 'EXCHANGE') {
            acc[productKey].exchangeCount++;
          }

          if (request.refundAmount && request.status === 'COMPLETED') {
            acc[productKey].totalRefunded += request.refundAmount;
          }

          if (request.reason && !acc[productKey].reasons.includes(request.reason)) {
            acc[productKey].reasons.push(request.reason);
          }
        });
      }
      return acc;
    }, {} as Record<string, any>);

    console.log('Product return counts:', Object.keys(productReturnCounts).length, 'products found');
    console.log('Sample products:', Object.values(productReturnCounts).slice(0, 3));

    // Get sales data for accurate return rate calculation
    const productIds = Object.values(productReturnCounts).map((p: any) => p.productId);
    console.log('Getting sales data for products:', productIds);

    // Query all orders to get product sales data
    const allOrders = await prisma.order.findMany({
      where: {
        status: { in: ['completed', 'confirmed'] } // Only count successful orders
      },
      select: {
        products: true,
        status: true,
        createdAt: true
      }
    });

    // Calculate total sold quantities for each product
    const productSalesData = {} as Record<string, { totalSold: number; totalRevenue: number }>;

    allOrders.forEach(order => {
      if (order.products) {
        let products;
        try {
          products = typeof order.products === 'string' ? JSON.parse(order.products) : order.products;
        } catch (e) {
          products = [];
        }

        if (Array.isArray(products)) {
          products.forEach((product: any) => {
            const productId = product.id || product.productId || product.selectedProductId;
            if (productId) {
              if (!productSalesData[productId]) {
                productSalesData[productId] = { totalSold: 0, totalRevenue: 0 };
              }
              const quantity = product.quantity || 1;
              const price = product.price || 0;
              productSalesData[productId].totalSold += quantity;
              productSalesData[productId].totalRevenue += price * quantity;
            }
          });
        }
      }
    });

    console.log('Sales data calculated for', Object.keys(productSalesData).length, 'products');

    const productAnalysis = Object.values(productReturnCounts)
      .map((product: any) => {
        const salesData = productSalesData[product.productId] || { totalSold: 0, totalRevenue: 0 };

        // Calculate accurate return rate
        const returnRate = salesData.totalSold > 0 ? (product.returnCount / salesData.totalSold) * 100 : 0;

        return {
          productId: product.productId,
          productName: product.productName,
          returnCount: product.returnCount,
          exchangeCount: product.exchangeCount,
          returnRate: Math.round(returnRate * 100) / 100, // Round to 2 decimal places
          totalRefunded: product.totalRefunded,
          mainReasons: product.reasons,
          totalSold: salesData.totalSold,
          totalRevenue: salesData.totalRevenue
        };
      })
      .filter(product => product.returnCount > 0 || product.exchangeCount > 0)
      .sort((a, b) => {
        // Sort by return rate and total issues
        const aTotalIssues = a.returnCount + a.exchangeCount;
        const bTotalIssues = b.returnCount + b.exchangeCount;
        return bTotalIssues - aTotalIssues || b.returnRate - a.returnRate;
      });

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
      productAnalysis,
      timeAnalysis: [], // Would implement with historical data
      businessInsights
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error fetching return analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
