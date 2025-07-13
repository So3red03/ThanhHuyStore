import { NextRequest, NextResponse } from 'next/server';
import { DiscordReportService } from '../../../libs/discord/discordReportService';
import prisma from '../../../libs/prismadb';

// GET: Cron job để gửi báo cáo tự động
export async function GET(request: NextRequest) {
  try {
    // Lấy settings hoặc tạo default settings
    let settings = await prisma.adminSettings.findFirst();

    if (!settings) {
      // Tạo default settings
      settings = await prisma.adminSettings.create({
        data: {
          dailyReports: true,
          reportInterval: 24, // 24 giờ default
          discordNotifications: true,
          orderNotifications: true,
          emailNotifications: true,
          analyticsTracking: true,
          lowStockAlerts: true,
          autoVoucherSuggestion: true,
          createdBy: 'SYSTEM',
          updatedBy: 'SYSTEM'
        }
      });
    }

    if (!settings.dailyReports) {
      return NextResponse.json({
        message: 'Daily reports disabled',
        success: true
      });
    }

    // 🧪 TESTING: Override để gửi báo cáo mỗi phút thay vì theo settings
    const reportIntervalMinutes = 1; // 1 phút cho testing
    const reportInterval = reportIntervalMinutes / 60; // Convert to hours

    // Kiểm tra báo cáo cuối cùng
    const lastReport = await prisma.reportLog.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    const now = new Date();
    let shouldSendReport = false;

    if (!lastReport) {
      // Chưa có báo cáo nào, gửi báo cáo đầu tiên
      shouldSendReport = true;
    } else {
      // Kiểm tra thời gian từ báo cáo cuối
      const timeSinceLastReport = now.getTime() - lastReport.createdAt.getTime();
      const intervalMs = reportInterval * 60 * 60 * 1000; // Convert hours to milliseconds

      if (timeSinceLastReport >= intervalMs) {
        shouldSendReport = true;
      } else {
        const remainingTime = Math.round((intervalMs - timeSinceLastReport) / 1000 / 60);
      }
    }

    if (shouldSendReport) {
      // Gửi báo cáo
      await DiscordReportService.sendReport(reportInterval);
      const success = true;

      if (success) {
        // Log báo cáo thành công
        await prisma.reportLog.create({
          data: {
            type: 'SCHEDULED',
            interval: reportInterval,
            success: true,
            sentAt: now
          }
        });

        return NextResponse.json({
          message: 'Report sent successfully',
          success: true,
          reportInterval,
          sentAt: now.toISOString()
        });
      } else {
        // Log báo cáo thất bại
        await prisma.reportLog.create({
          data: {
            type: 'SCHEDULED',
            interval: reportInterval,
            success: false,
            sentAt: now,
            error: 'Failed to send Discord report'
          }
        });

        return NextResponse.json(
          {
            message: 'Failed to send report',
            success: false,
            error: 'Discord webhook failed'
          },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json({
        message: 'No report needed at this time',
        success: true,
        nextReportIn: reportInterval * 60 * 60 * 1000 - (now.getTime() - (lastReport?.createdAt.getTime() || 0))
      });
    }
  } catch (error) {
    console.error('❌ Cron job error:', error);

    // Log lỗi
    try {
      await prisma.reportLog.create({
        data: {
          type: 'SCHEDULED',
          interval: 0,
          success: false,
          sentAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      {
        message: 'Cron job failed',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST: Manual trigger cho cron job (for testing)
export async function POST(request: NextRequest) {
  try {
    const { force } = await request.json();

    if (force) {
      // Force send report regardless of interval
      const reportInterval = 1 / 60; // 1 phút cho testing

      await DiscordReportService.sendReport(reportInterval);
      const success = true;

      if (success) {
        await prisma.reportLog.create({
          data: {
            type: 'MANUAL',
            interval: reportInterval,
            success: true,
            sentAt: new Date()
          }
        });

        return NextResponse.json({
          message: 'Manual report sent successfully',
          success: true
        });
      } else {
        return NextResponse.json(
          {
            message: 'Failed to send manual report',
            success: false
          },
          { status: 500 }
        );
      }
    } else {
      // Use normal cron logic
      return await GET(request);
    }
  } catch (error) {
    console.error('Manual cron trigger error:', error);
    return NextResponse.json(
      {
        message: 'Manual trigger failed',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
