import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';

export async function GET(request: NextRequest, { params }: { params: { campaignId: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const redirectUrl = searchParams.get('redirect');

    if (!redirectUrl) {
      return NextResponse.json({ error: 'Redirect URL is required' }, { status: 400 });
    }

    const { campaignId } = params;

    // Get user agent and other tracking info
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    const currentHour = new Date().getHours();

    // Determine time period
    let timePeriod = 'morning'; // 6-12
    if (currentHour >= 12 && currentHour < 18) timePeriod = 'afternoon'; // 12-18
    else if (currentHour >= 18 || currentHour < 6) timePeriod = 'evening'; // 18-6

    // Get current campaign to update stats
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId }
    });

    if (campaign) {
      // Parse existing stats
      const deviceStats = (campaign.deviceStats as any) || { mobile: 0, desktop: 0 };
      const timeStats = (campaign.timeStats as any) || { morning: 0, afternoon: 0, evening: 0 };

      // Update stats
      if (isMobile) {
        deviceStats.mobile = (deviceStats.mobile || 0) + 1;
      } else {
        deviceStats.desktop = (deviceStats.desktop || 0) + 1;
      }

      timeStats[timePeriod] = (timeStats[timePeriod] || 0) + 1;

      // Update campaign with enhanced tracking
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          clickCount: {
            increment: 1
          },
          deviceStats: deviceStats,
          timeStats: timeStats
        }
      });

      console.log(`📊 Enhanced email click tracked for campaign: ${campaignId}`, {
        device: isMobile ? 'mobile' : 'desktop',
        timePeriod,
        totalClicks: campaign.clickCount + 1
      });
    } else {
      console.warn(`⚠️ Campaign not found: ${campaignId}`);
    }

    // Redirect to the actual product page
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Error tracking email click:', error);

    // Even if tracking fails, still redirect to the product page
    const { searchParams } = new URL(request.url);
    const redirectUrl = searchParams.get('redirect');

    if (redirectUrl) {
      return NextResponse.redirect(redirectUrl);
    }

    // Fallback to homepage if no redirect URL
    return NextResponse.redirect(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
  }
}
