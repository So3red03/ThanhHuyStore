import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import { getCurrentUser } from '@/app/actions/getCurrentUser';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    // Chỉ admin/staff mới có thể xem analytics
    if (!currentUser || !['ADMIN', 'STAFF'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30'; // days
    const campaignType = searchParams.get('campaignType') || 'all';
    const customStartDate = searchParams.get('startDate');
    const customEndDate = searchParams.get('endDate');

    let startDate: Date;
    let endDate: Date = new Date(); // Default to now
    let useTimeFilter = true;

    if (customStartDate && customEndDate) {
      // Use custom date range
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      // Set end date to end of day
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Use timeRange (days back from now)
      const days = parseInt(timeRange);
      if (days <= 0) {
        // If days is 0 or negative, get all data
        useTimeFilter = false;
        startDate = new Date(0); // Beginning of time
      } else {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
      }
    }

    // Build filter conditions
    const whereConditions: any = useTimeFilter
      ? {
          sentAt: {
            gte: startDate,
            ...(customStartDate && customEndDate ? { lte: endDate } : {})
          }
        }
      : {};

    if (campaignType !== 'all') {
      whereConditions.campaignType = campaignType;
    }

    // Get campaign data with product relations
    const campaigns = await prisma.emailCampaign.findMany({
      where: whereConditions,
      include: {
        product: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        sentAt: 'desc'
      }
    });

    // Calculate overall metrics
    const totalCampaigns = campaigns.length;
    const totalEmailsSent = campaigns.reduce((sum, c) => sum + c.recipientCount, 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clickCount, 0);
    const averageCTR = totalEmailsSent > 0 ? (totalClicks / totalEmailsSent) * 100 : 0;

    // Campaign performance over time
    const campaignsByDate = campaigns.reduce((acc: any, campaign) => {
      const date = campaign.sentAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          campaigns: 0,
          emailsSent: 0,
          clicks: 0,
          ctr: 0
        };
      }
      acc[date].campaigns += 1;
      acc[date].emailsSent += campaign.recipientCount;
      acc[date].clicks += campaign.clickCount;
      acc[date].ctr = acc[date].emailsSent > 0 ? (acc[date].clicks / acc[date].emailsSent) * 100 : 0;
      return acc;
    }, {});

    const timeSeriesData = Object.values(campaignsByDate).sort(
      (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Product performance
    const productPerformance = campaigns
      .filter(c => c.product)
      .reduce((acc: any, campaign) => {
        const productId = campaign.product!.id;
        const productName = campaign.product!.name;
        const categoryName = campaign.product!.category?.name || 'Không có danh mục';

        if (!acc[productId]) {
          acc[productId] = {
            productId,
            productName,
            categoryName,
            campaignCount: 0,
            totalEmailsSent: 0,
            totalClicks: 0,
            ctr: 0
          };
        }

        acc[productId].campaignCount += 1;
        acc[productId].totalEmailsSent += campaign.recipientCount;
        acc[productId].totalClicks += campaign.clickCount;
        acc[productId].ctr =
          acc[productId].totalEmailsSent > 0 ? (acc[productId].totalClicks / acc[productId].totalEmailsSent) * 100 : 0;

        return acc;
      }, {});

    const topProducts = Object.values(productPerformance)
      .sort((a: any, b: any) => b.ctr - a.ctr)
      .slice(0, 10);

    // Category performance
    const categoryPerformance = campaigns
      .filter(c => c.product?.category)
      .reduce((acc: any, campaign) => {
        const categoryName = campaign.product!.category!.name;

        if (!acc[categoryName]) {
          acc[categoryName] = {
            categoryName,
            campaignCount: 0,
            totalEmailsSent: 0,
            totalClicks: 0,
            ctr: 0
          };
        }

        acc[categoryName].campaignCount += 1;
        acc[categoryName].totalEmailsSent += campaign.recipientCount;
        acc[categoryName].totalClicks += campaign.clickCount;
        acc[categoryName].ctr =
          acc[categoryName].totalEmailsSent > 0
            ? (acc[categoryName].totalClicks / acc[categoryName].totalEmailsSent) * 100
            : 0;

        return acc;
      }, {});

    const topCategories = Object.values(categoryPerformance)
      .sort((a: any, b: any) => b.ctr - a.ctr)
      .slice(0, 5);

    // Device and time analytics
    const deviceStats = campaigns.reduce(
      (acc: any, campaign) => {
        const stats = campaign.deviceStats as any;
        if (stats) {
          acc.mobile += stats.mobile || 0;
          acc.desktop += stats.desktop || 0;
        }
        return acc;
      },
      { mobile: 0, desktop: 0 }
    );

    const timeStats = campaigns.reduce(
      (acc: any, campaign) => {
        const stats = campaign.timeStats as any;
        if (stats) {
          acc.morning += stats.morning || 0;
          acc.afternoon += stats.afternoon || 0;
          acc.evening += stats.evening || 0;
        }
        return acc;
      },
      { morning: 0, afternoon: 0, evening: 0 }
    );

    // Campaign type performance
    const campaignTypeStats = campaigns.reduce((acc: any, campaign) => {
      const type = campaign.campaignType;
      if (!acc[type]) {
        acc[type] = {
          type,
          count: 0,
          emailsSent: 0,
          clicks: 0,
          ctr: 0
        };
      }
      acc[type].count += 1;
      acc[type].emailsSent += campaign.recipientCount;
      acc[type].clicks += campaign.clickCount;
      acc[type].ctr = acc[type].emailsSent > 0 ? (acc[type].clicks / acc[type].emailsSent) * 100 : 0;
      return acc;
    }, {});

    // Enhanced campaign performance data
    const campaignPerformance = campaigns.map(c => ({
      campaignId: c.id,
      campaignTitle: c.campaignTitle || 'Chiến dịch không tên',
      campaignType: c.campaignType,
      sentAt: c.sentAt.toISOString(),
      recipientCount: c.recipientCount,
      clickCount: c.clickCount,
      ctr: c.recipientCount > 0 ? Math.round((c.clickCount / c.recipientCount) * 10000) / 100 : 0,
      productName: c.product?.name,
      status: c.status,
      engagement:
        c.clickCount > c.recipientCount * 0.05 ? 'high' : c.clickCount > c.recipientCount * 0.02 ? 'medium' : 'low',
      trend: 'stable' // Could be enhanced with historical comparison
    }));

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalCampaigns,
          totalEmailsSent,
          totalClicks,
          averageCTR: Math.round(averageCTR * 100) / 100,
          deliveryRate: 98.5, // Mock data - could be calculated from actual delivery stats
          engagementRate: Math.round(averageCTR * 1.2 * 100) / 100, // Mock engagement rate
          totalRevenue: 0, // Would need order tracking integration
          roi: 0 // Would need cost and revenue tracking
        },
        campaignPerformance: campaignPerformance.slice(0, 20),
        productPerformance: topProducts.map((p: any) => ({
          productId: p.productId,
          productName: p.productName,
          categoryName: p.categoryName,
          campaignCount: p.campaignCount,
          totalEmailsSent: p.totalEmailsSent,
          totalClicks: p.totalClicks,
          ctr: p.ctr,
          conversionRate: Math.round(Math.random() * 5 * 100) / 100, // Mock data
          revenue: Math.round(Math.random() * 10000000) // Mock data
        })),
        campaignTypeStats: Object.values(campaignTypeStats).map((stat: any) => ({
          ...stat,
          avgEngagement: Math.round(stat.ctr * 1.2 * 100) / 100
        })),
        timeAnalysis: timeSeriesData.slice(0, 30).map((item: any) => ({
          period: item.date,
          campaigns: item.campaigns,
          emailsSent: item.emailsSent,
          clicks: item.clicks,
          ctr: item.ctr,
          trend: Math.random() > 0.5 ? 1 : -1 // Mock trend data
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching email marketing analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
