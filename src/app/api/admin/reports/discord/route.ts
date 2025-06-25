import { NextRequest, NextResponse } from 'next/server';
import { DiscordReportService } from '../../../../libs/discord/discordReportService';
import { getCurrentUser } from '../../../../actions/getCurrentUser';

// POST: Gửi báo cáo Discord
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    // Kiểm tra quyền admin
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, hours } = body;

    let success = false;

    if (type === 'test') {
      // Gửi báo cáo test
      await DiscordReportService.sendReport(1); // Test với 1 giờ
      success = true;
    } else if (type === 'report') {
      // Gửi báo cáo thực tế
      const reportHours = hours || 24;
      await DiscordReportService.sendReport(reportHours);
      success = true;
    } else {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    if (success) {
      return NextResponse.json({
        message: type === 'test' ? 'Báo cáo test đã được gửi thành công!' : 'Báo cáo đã được gửi thành công!',
        success: true
      });
    } else {
      return NextResponse.json(
        { error: 'Không thể gửi báo cáo. Vui lòng kiểm tra lại Discord webhook.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Discord report API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Lấy dữ liệu báo cáo (không gửi Discord)
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24');

    const reportData = await DiscordReportService.getReportData(hours);

    return NextResponse.json({
      data: reportData,
      success: true
    });
  } catch (error) {
    console.error('Get report data error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
