import { NextResponse } from 'next/server';
import { ProductAnalyticsService } from '@/app/libs/ai/productAnalyticsService';

/**
 * Cron job API endpoint để chạy AI analysis định kỳ
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🕐 Starting scheduled AI analysis...');
    const startTime = Date.now();

    // Chạy AI analysis
    const result = await ProductAnalyticsService.runAIAnalysis();
    
    const duration = Date.now() - startTime;
    console.log(`✅ Scheduled AI analysis completed in ${duration}ms:`, result);

    return NextResponse.json({
      success: true,
      message: 'Scheduled AI analysis completed successfully',
      data: {
        ...result,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        trigger: 'cron'
      }
    });

  } catch (error) {
    console.error('❌ Scheduled AI Analysis failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Scheduled AI analysis failed',
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🧪 Manual cron test triggered');
    
    // Chạy AI analysis
    const result = await ProductAnalyticsService.runAIAnalysis();
    
    console.log('✅ Manual cron test completed:', result);

    return NextResponse.json({
      success: true,
      message: 'Manual cron test completed successfully',
      data: {
        ...result,
        timestamp: new Date().toISOString(),
        trigger: 'manual_test'
      }
    });

  } catch (error) {
    console.error('❌ Manual cron test failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Manual cron test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
