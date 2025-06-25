import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';

// Test endpoint để trigger cron job manually
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🧪 Manual cron trigger started by admin:', currentUser.email);

    // Call the actual cron endpoint
    const cronUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cron/reports`;
    
    const response = await fetch(cronUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    console.log('📊 Cron job result:', result);

    return NextResponse.json({
      success: true,
      message: 'Manual cron trigger completed',
      cronResult: result,
      triggeredBy: currentUser.email,
      triggeredAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Manual cron trigger error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to trigger cron job',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// GET endpoint để check cron status
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get latest report logs
    const prisma = (await import('@/app/libs/prismadb')).default;
    
    const latestReports = await prisma.reportLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return NextResponse.json({
      success: true,
      latestReports,
      serverTime: new Date().toISOString(),
      message: 'Cron status retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Get cron status error:', error);
    return NextResponse.json(
      { error: 'Failed to get cron status' }, 
      { status: 500 }
    );
  }
}
