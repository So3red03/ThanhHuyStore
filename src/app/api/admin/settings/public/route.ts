import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Get public settings that don't require authentication
export async function GET() {
  try {
    const settings = await prisma.adminSettings.findFirst({
      select: {
        sessionTimeout: true,
        analyticsTracking: true,
        pushNotifications: true,
        chatbotSupport: true
      }
    });

    // Return default values if no settings found
    return NextResponse.json(
      {
        sessionTimeout: settings?.sessionTimeout || 30,
        analyticsTracking: settings?.analyticsTracking ?? true,
        pushNotifications: settings?.pushNotifications ?? false,
        chatbotSupport: settings?.chatbotSupport ?? false
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
    console.error('Get public settings error:', error);
    // Return defaults on error
    return NextResponse.json(
      {
        sessionTimeout: 30,
        analyticsTracking: true,
        pushNotifications: false,
        chatbotSupport: false
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0'
        }
      }
    );
  }
}
