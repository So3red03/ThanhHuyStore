import { NextResponse } from 'next/server';
// DEPRECATED: AIRecommendationService replaced by ProactiveAnalyzer
// import { AIRecommendationService } from '@/app/libs/ai/aiRecommendationService';

/**
 * Cron job API endpoint để chạy AI recommendations định kỳ
 * GET /api/cron/ai-analysis
 *
 * Endpoint này được thiết kế để chạy bởi:
 * - Vercel Cron Jobs
 * - External cron services (như cron-job.org)
 * - Manual triggers
 *
 * Security: Sử dụng CRON_SECRET để bảo vệ endpoint
 */
export async function GET(request: Request) {
  try {
    // Kiểm tra CRON_SECRET để bảo vệ endpoint
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.CRON_SECRET) {
      console.log('❌ Unauthorized cron request - invalid secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🕐 Starting scheduled AI recommendations...');
    const startTime = Date.now();

    // DEPRECATED: AI recommendations now handled by ProactiveAnalyzer automatically
    // const result = await AIRecommendationService.runAIRecommendations();
    const result = {
      analyzed: 0,
      recommendations: 0,
      notifications: 0,
      message: 'DEPRECATED: Now handled by ProactiveAnalyzer automatically'
    };

    const duration = Date.now() - startTime;
    console.log(`✅ Scheduled AI recommendations completed in ${duration}ms:`, result);

    return NextResponse.json({
      success: true,
      message: `DEPRECATED: AI recommendations now handled by ProactiveAnalyzer automatically. ${result.message}`,
      data: {
        ...result,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        trigger: 'cron'
      }
    });
  } catch (error) {
    console.error('❌ Scheduled AI Recommendations failed:', error);

    return NextResponse.json(
      {
        error: 'Scheduled AI recommendations failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint để test cron job manually
 * POST /api/cron/ai-analysis
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Kiểm tra secret
    if (body.secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🧪 Manual AI recommendations test triggered');

    // DEPRECATED: AI recommendations now handled by ProactiveAnalyzer automatically
    // const result = await AIRecommendationService.runAIRecommendations();
    const result = {
      analyzed: 0,
      recommendations: 0,
      notifications: 0,
      message: 'DEPRECATED: Now handled by ProactiveAnalyzer automatically'
    };

    console.log('✅ Manual AI recommendations test completed:', result);

    return NextResponse.json({
      success: true,
      message: `DEPRECATED: AI recommendations now handled by ProactiveAnalyzer automatically. ${result.message}`,
      data: {
        ...result,
        timestamp: new Date().toISOString(),
        trigger: 'manual_test'
      }
    });
  } catch (error) {
    console.error('❌ Manual AI recommendations test failed:', error);

    return NextResponse.json(
      {
        error: 'Manual AI recommendations test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
