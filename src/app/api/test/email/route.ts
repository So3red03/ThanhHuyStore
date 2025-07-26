import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/getCurrentUser';
import { sendTestEmail } from '@/app/utils/emailService';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can test email service
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { email, message } = body;

    // Use current user's email if no email provided
    const testEmail = email || currentUser.email;
    const testMessage = message || `Test email for ${currentUser.name || 'Admin'}`;

    if (!testEmail) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    console.log(`📧 [TEST-API] Testing email service for: ${testEmail}`);

    // Send test email
    const result = await sendTestEmail(testEmail, testMessage);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        details: {
          to: testEmail,
          messageId: result.messageId,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send test email',
          details: result.error
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('📧 [TEST-API] Error in email test endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check email service status
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can check email service status
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check environment variables
    const emailConfig = {
      smtpHost: process.env.SMTP_HOST || 'Not configured',
      smtpPort: process.env.SMTP_PORT || 'Not configured',
      smtpUser: process.env.SMTP_USER || process.env.GMAIL_USER || 'Not configured',
      hasPassword: !!(process.env.SMTP_PASS || process.env.GMAIL_PASS),
      environment: process.env.NODE_ENV || 'development'
    };

    return NextResponse.json({
      success: true,
      message: 'Email service configuration',
      config: {
        ...emailConfig,
        // Don't expose actual password
        smtpUser: emailConfig.smtpUser.replace(/(.{3}).*(@.*)/, '$1***$2')
      }
    });
  } catch (error) {
    console.error('📧 [TEST-API] Error checking email config:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check email configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
