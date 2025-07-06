import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/app/libs/prismadb';
import { clearSessionConfigCache } from '@/app/libs/auth/getAdminSessionConfig';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Simple auth check - replace with your actual authOptions
const getCurrentUser = async () => {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) return null;

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    return currentUser;
  } catch (error) {
    return null;
  }
};

// GET: Lấy settings (chỉ admin)
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    // Kiểm tra admin permission
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    // Lấy settings từ database
    let settings = await prisma.adminSettings.findFirst();

    // Nếu chưa có settings, tạo default
    if (!settings) {
      settings = await prisma.adminSettings.create({
        data: {
          // Notification settings
          discordNotifications: true,
          orderNotifications: true,
          emailNotifications: true,
          pushNotifications: false,

          // System settings
          analyticsTracking: true,
          sessionTimeout: 30,

          // Automation settings
          lowStockAlerts: true,
          chatbotSupport: false,
          autoVoucherSuggestion: true,

          // Report settings - Set to 5 minutes for testing
          dailyReports: true,
          reportInterval: 0.083, // 5 minutes = 0.083 hours

          // Payment settings - CRITICAL
          codPayment: true,
          momoPayment: false, // Default false for security
          stripePayment: false, // Default false for security

          // Audit fields
          createdBy: currentUser.email,
          updatedBy: currentUser.email
        }
      });
    }

    return NextResponse.json(
      {
        settings,
        success: true
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0'
        }
      }
    );
  } catch (error) {
    console.error('Get admin settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Cập nhật settings (chỉ admin)
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    // Kiểm tra admin permission
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const body = await request.json();

    // Validation cho critical settings
    const {
      discordNotifications,
      orderNotifications,
      emailNotifications,
      pushNotifications,
      analyticsTracking,
      sessionTimeout,
      lowStockAlerts,
      chatbotSupport,
      autoVoucherSuggestion,
      dailyReports,
      reportInterval,
      codPayment,
      momoPayment,
      stripePayment
    } = body;

    // Validate critical business rules
    if (!codPayment && !momoPayment && !stripePayment) {
      return NextResponse.json({ error: 'Ít nhất một phương thức thanh toán phải được bật' }, { status: 400 });
    }

    // if (sessionTimeout < 15 || sessionTimeout > 480) {
    //   return NextResponse.json({ error: 'Session timeout phải từ 15 phút đến 8 giờ' }, { status: 400 });
    // }

    // Upsert settings - MongoDB uses string IDs
    let settings = await prisma.adminSettings.findFirst();

    if (settings) {
      // Update existing settings
      settings = await prisma.adminSettings.update({
        where: { id: settings.id },
        data: {
          discordNotifications,
          orderNotifications,
          emailNotifications,
          pushNotifications,
          analyticsTracking,
          sessionTimeout,
          lowStockAlerts,
          chatbotSupport,
          autoVoucherSuggestion,
          dailyReports,
          reportInterval,
          codPayment,
          momoPayment,
          stripePayment,
          updatedBy: currentUser.email
        }
      });
    } else {
      // Create new settings
      settings = await prisma.adminSettings.create({
        data: {
          discordNotifications,
          orderNotifications,
          emailNotifications,
          pushNotifications,
          analyticsTracking,
          sessionTimeout,
          lowStockAlerts,
          chatbotSupport,
          autoVoucherSuggestion,
          dailyReports,
          reportInterval,
          codPayment,
          momoPayment,
          stripePayment,
          createdBy: currentUser.email,
          updatedBy: currentUser.email
        }
      });
    }

    // Clear session config cache when settings are updated
    clearSessionConfigCache();

    // 🎯 AUDIT LOG: Admin Settings Updated
    const { AuditLogger, AuditEventType, AuditSeverity } = await import('@/app/utils/auditLogger');
    await AuditLogger.log({
      eventType: AuditEventType.ADMIN_SETTINGS_UPDATED,
      severity: AuditSeverity.MEDIUM,
      userId: currentUser.id,
      userEmail: currentUser.email!,
      userRole: 'ADMIN',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      description: 'Cập nhật cài đặt hệ thống',
      details: {
        changedFields: Object.keys(body),
        changes: body,
        timestamp: new Date()
      },
      resourceType: 'Settings'
    });

    return NextResponse.json(
      {
        settings,
        success: true,
        message: 'Cài đặt đã được cập nhật thành công'
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0'
        }
      }
    );
  } catch (error) {
    console.error('Update admin settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
